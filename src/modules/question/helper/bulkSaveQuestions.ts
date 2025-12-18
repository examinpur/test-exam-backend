import questionServices from '../services/questionServices';
import chapterModel from '../../../models/chapterModel';
import topicModel from '../../../models/topicModel';
import paperModel from '../../../models/paperModel';

type Options = {
  concurrency?: number;
};

const chunkArray = <T>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const buildReferenceMaps = async (dataset: any[]) => {
  const chapterSlugs = new Set<string>();
  const topicSlugs = new Set<string>();
  const paperSlugs = new Set<string>();

  for (const subject of dataset) {
    for (const q of subject.questions || []) {
      if (q.chapter) chapterSlugs.add(q.chapter);
      if (q.topic) topicSlugs.add(q.topic);
      if (q.topicName) topicSlugs.add(q.topicName);
      if (q.paperId) paperSlugs.add(q.paperId);
    }
  }

  const [chapters, topics, papers] = await Promise.all([
    chapterSlugs.size > 0
      ? chapterModel.find({ slug: { $in: Array.from(chapterSlugs) }, isActive: true }).lean()
      : Promise.resolve([]),
    topicSlugs.size > 0
      ? topicModel.find({ slug: { $in: Array.from(topicSlugs) }, isActive: true }).lean()
      : Promise.resolve([]),
    paperSlugs.size > 0
      ? paperModel.find({ slug: { $in: Array.from(paperSlugs) }, isActive: true }).lean()
      : Promise.resolve([]),
  ]);

  return {
    chapters: Object.fromEntries((chapters as any[]).map((c) => [c.slug, c])),
    topics: Object.fromEntries((topics as any[]).map((t) => [t.slug, t])),
    papers: Object.fromEntries((papers as any[]).map((p) => [p.slug, p])),
  };
};

const mapQuestionToPayload = (q: any, refs: any) => {
  const kindMap: Record<string, string> = {
    mcq: 'MCQ',
    msq: 'MSQ',
    integer: 'INTEGER',
    fill_blank: 'FILL_BLANK',
    true_false: 'TRUE_FALSE',
  };

  const kind = kindMap[q.type?.toLowerCase()];
  if (!kind) return { payload: null, missing: ['unsupported_kind'] };

  if (kind === 'INTEGER' && q.question?.en?.answer == null) {
    return { payload: null, missing: ['missing_integer_answer'] };
  }

  const chapter = refs.chapters[q.chapter];
  if (!chapter) {
    return { payload: null, missing: [`chapter:${q.chapter ?? 'unknown'}`] };
  }

  const topicSlug = q.topic ?? q.topicName;
  const topic = topicSlug ? refs.topics[topicSlug] : undefined;

  const paperSlug = q.paperId;
  const paper = paperSlug ? refs.papers[paperSlug] : undefined;

  const missing: string[] = [];
  if (!chapter.boardId) missing.push('boardId_from_chapter');
  if (!chapter.examId) missing.push('examId_from_chapter');
  if (!chapter.subjectId) missing.push('subjectId_from_chapter');
  if (!chapter.chapterGroupId) missing.push('chapterGroupId_from_chapter');

  if (missing.length > 0) return { payload: null, missing };

  const name = q.question?.en?.content
    ? String(q.question.en.content).slice(0, 80)
    : q.permalink ?? 'untitled';

  const payload: any = {
    boardId: chapter.boardId,
    examId: chapter.examId,
    subjectId: chapter.subjectId,
    chapterGroupId: chapter.chapterGroupId,
    chapterId: chapter._id,
    topicId: topic?._id || undefined,
    paperRefId: paper?._id || undefined,
    paperId: paper?.slug || paperSlug || undefined,

    kind,
    name,

    marks: typeof q.marks === 'number' ? q.marks : undefined,
    negMarks: typeof q.negMarks === 'number' ? q.negMarks : undefined,
    difficulty: q.difficulty,
    calculator: false,

    prompt: {
      en: {
        content: q.question?.en?.content ?? '',
        options: q.question?.en?.options ?? [],
        explanation: q.question?.en?.explanation ?? undefined,
      },
      ...(q.question?.hi
        ? {
            hi: {
              content: q.question.hi.content,
              options: q.question.hi.options ?? [],
              explanation: q.question.hi.explanation ?? undefined,
            },
          }
        : {}),
    },

    correct:
      kind === 'INTEGER'
        ? { integer: Number(q.question.en.answer) }
        : { identifiers: q.question.en.correct_options ?? [] },

    year: q.year,
    yearKey: q.yearKey,

    section: q.section ?? [],
    tags: topicSlug ? [topicSlug] : [],
  };

  return { payload, missing: [] };
};

export const bulkCreateQuestions = async (
  dataset: any[],
  options: Options = {},
) => {
  const concurrency = options.concurrency ?? 10;

  if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
    return {
      total: 0,
      created: 0,
      failed: 0,
      faultyCount: 0,
      faulty: [],
      error: 'Invalid or empty dataset provided',
    };
  }

  const results = { total: 0, created: 0, failed: 0 };
  const faultyQuestions: any[] = [];

  const refs = await buildReferenceMaps(dataset);

  const tasks: { q: any; payload: any }[] = [];

  for (const subject of dataset) {
    for (const q of subject.questions || []) {
      results.total++;
      const { payload, missing } = mapQuestionToPayload(q, refs);

      if (!payload) {
        results.failed++;
        faultyQuestions.push({
          reason: 'Reference resolution failed or invalid data',
          missing,
          question_id: q.question_id,
          chapter: q.chapter,
          topic: q.topic ?? q.topicName,
          paperId: q.paperId,
        });
        continue;
      }

      tasks.push({ q, payload });
    }
  }

  const chunks = chunkArray(tasks, concurrency);

  for (const chunk of chunks) {
    const promises = chunk.map(async (it) => {
      try {
        const res = await questionServices.createQuestion(it.payload);
        return { it, res };
      } catch (err: any) {
        return { it, res: { success: false, message: err?.message ?? String(err) } };
      }
    });

    const settled = await Promise.all(promises);

    for (const s of settled) {
      if (s.res.success) {
        results.created++;
      } else {
        results.failed++;
        faultyQuestions.push({
          reason: s.res.message || 'createQuestion failed',
          question_id: s.it.q.question_id,
        });
      }
    }
  }

  return {
    ...results,
    faultyCount: faultyQuestions.length,
    faulty: faultyQuestions,
  };
};
