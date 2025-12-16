// bulkSaveQuestionsOptimized.ts
import questionServices from '../services/questionServices';

import boardModel from '../../../models/boardModel';
import examModel from '../../../models/examModel';
import subjectModel from '../../../models/subjectModel';
import chapterGroupModel from '../../../models/chapterGroupModel';
import chapterModel from '../../../models/chapterModel';
import topicModel from '../../../models/topicModel';

import fs from 'fs';
import path from 'path';

type Options = {
  // explicit board slug if dataset doesn't include examGroup or uses different name
  boardSlug?: string;
  // mapping from dataset examGroup -> boardSlug (example: { jee: 'jee', cbse: 'cbse' })
  boardSlugMap?: Record<string, string>;
  // concurrency for write/create calls
  concurrency?: number;
  // dataset directory to store faulty files (defaults to 'src/question/dataset')
  datasetDir?: string;
};

/* -------------------------
   helpers
------------------------- */
const chunkArray = <T>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

/* -------------------------------------------------------
   MAIN: optimized building of slug sets, querying DB
------------------------------------------------------- */
const buildReferenceMapsForDataset = async (dataset: any[], options: Options) => {
  // collect unique slugs from dataset
  const boardSlugSet = new Set<string>();
  const examSlugSet = new Set<string>();
  const subjectSlugSet = new Set<string>();
  const chapterGroupSlugSet = new Set<string>();
  const chapterSlugSet = new Set<string>();
  const topicSlugSet = new Set<string>();

  for (const subject of dataset) {
    // Some datasets wrap questions under subjects; include subject-level examGroup if present
    const possibleBoard = (subject as any).examGroup;
    if (possibleBoard) {
      // allow mapping override
      const mapped = options.boardSlugMap?.[possibleBoard] ?? possibleBoard;
      if (mapped) boardSlugSet.add(mapped);
    }

    for (const q of (subject.questions || [])) {
      if (q.exam) examSlugSet.add(q.exam);
      if (q.subject) subjectSlugSet.add(q.subject);
      if (q.chapterGroup) chapterGroupSlugSet.add(q.chapterGroup);
      if (q.chapter) chapterSlugSet.add(q.chapter);
      // topic may be stored in `topic` or `topicName`
      if (q.topic) topicSlugSet.add(q.topic);
      if (q.topicName) topicSlugSet.add(q.topicName);
      if (q.examGroup && !options.boardSlug) {
        // examGroup may be a board slug candidate
        const mapped = options.boardSlugMap?.[q.examGroup] ?? q.examGroup;
        if (mapped) boardSlugSet.add(mapped);
      }
    }
  }

  // if user provided explicit boardSlug, prefer that
  if (options.boardSlug) boardSlugSet.add(options.boardSlug);

  // convert sets to arrays
  const boardsToQuery = Array.from(boardSlugSet);
  const examsToQuery = Array.from(examSlugSet);
  const subjectsToQuery = Array.from(subjectSlugSet);
  const chapterGroupsToQuery = Array.from(chapterGroupSlugSet);
  const chaptersToQuery = Array.from(chapterSlugSet);
  const topicsToQuery = Array.from(topicSlugSet);

  // create query array with projection to minimize payload and use indexes
  const promises: Promise<any>[] = [];

  if (boardsToQuery.length > 0) {
    promises.push(boardModel.find({ slug: { $in: boardsToQuery }, isActive: true }, { _id: 1, slug: 1 }).lean());
  } else {
    promises.push(Promise.resolve([]));
  }
  if (examsToQuery.length > 0) {
    promises.push(examModel.find({ slug: { $in: examsToQuery }, isActive: true }, { _id: 1, slug: 1 }).lean());
  } else {
    promises.push(Promise.resolve([]));
  }
  if (subjectsToQuery.length > 0) {
    promises.push(subjectModel.find({ slug: { $in: subjectsToQuery }, isActive: true }, { _id: 1, slug: 1 }).lean());
  } else {
    promises.push(Promise.resolve([]));
  }
  if (chapterGroupsToQuery.length > 0) {
    promises.push(
      chapterGroupModel.find({ slug: { $in: chapterGroupsToQuery }, isActive: true }, { _id: 1, slug: 1 }).lean(),
    );
  } else {
    promises.push(Promise.resolve([]));
  }
  if (chaptersToQuery.length > 0) {
    promises.push(chapterModel.find({ slug: { $in: chaptersToQuery }, isActive: true }, { _id: 1, slug: 1 }).lean());
  } else {
    promises.push(Promise.resolve([]));
  }
  if (topicsToQuery.length > 0) {
    promises.push(topicModel.find({ slug: { $in: topicsToQuery }, isActive: true }, { _id: 1, slug: 1 }).lean());
  } else {
    promises.push(Promise.resolve([]));
  }

  // run all queries in parallel
  const [boards, exams, subjects, chapterGroups, chapters, topics] = await Promise.all(promises);

  // build maps
  const refs = {
    boards: Object.fromEntries((boards || []).map((b: any) => [b.slug, b._id])),
    exams: Object.fromEntries((exams || []).map((e: any) => [e.slug, e._id])),
    subjects: Object.fromEntries((subjects || []).map((s: any) => [s.slug, s._id])),
    chapterGroups: Object.fromEntries((chapterGroups || []).map((cg: any) => [cg.slug, cg._id])),
    chapters: Object.fromEntries((chapters || []).map((c: any) => [c.slug, c._id])),
    topics: Object.fromEntries((topics || []).map((t: any) => [t.slug, t._id])),
  };

  return refs;
};

/* -------------------------------------------------------
   MAP single dataset question -> payload using refs
   Returns { payload, missing: string[] } or null if unsupported kind
------------------------------------------------------- */
const mapQuestionUsingRefs = (q: any, refs: any, options: Options) => {
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

  // board resolution: use option or dataset examGroup -> map via boardSlugMap if present
  let boardSlug: string | undefined = options.boardSlug;
  if (!boardSlug) {
    boardSlug = q.examGroup ?? q.country ?? undefined;
    if (boardSlug && options.boardSlugMap?.[boardSlug]) boardSlug = options.boardSlugMap[boardSlug];
  }

  const boardId = boardSlug ? refs.boards[boardSlug] : undefined;
  const examId = refs.exams[q.exam];
  const subjectId = refs.subjects[q.subject];
  const chapterGroupId = refs.chapterGroups[q.chapterGroup];
  const chapterId = refs.chapters[q.chapter];
  // support topic or topicName
  const topicSlug = q.topic ?? q.topicName ?? undefined;
  const topicId = topicSlug ? refs.topics[topicSlug] : undefined;

  const missing: string[] = [];
  if (!boardId) missing.push(`board:${boardSlug ?? 'unknown'}`);
  if (!examId) missing.push(`exam:${q.exam ?? 'unknown'}`);
  if (!subjectId) missing.push(`subject:${q.subject ?? 'unknown'}`);
  if (!chapterGroupId) missing.push(`chapterGroup:${q.chapterGroup ?? 'unknown'}`);
  if (!chapterId) missing.push(`chapter:${q.chapter ?? 'unknown'}`);

  if (missing.length > 0) return { payload: null, missing };

  // safe slicing of content
  const name = q.question?.en?.content ? String(q.question.en.content).slice(0, 80) : q.permalink ?? 'untitled';

  const payload: any = {
    boardId,
    examId,
    subjectId,
    chapterGroupId,
    chapterId,
    topicId: topicId || undefined,

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
      // include hi only if present
      ...(q.question?.hi ? { hi: { content: q.question.hi.content, options: q.question.hi.options ?? [], explanation: q.question.hi.explanation ?? undefined } } : {}),
    },

    correct: kind === 'INTEGER' ? { integer: Number(q.question.en.answer) } : { identifiers: q.question.en.correct_options ?? [] },

    year: q.year,
    paperTitle: q.paperTitle,
    paperId: q.paperId,
    yearKey: q.yearKey,

    section: q.section ?? [],
    tags: q.topic ? [q.topic] : [],
  };

  return { payload, missing: [] };
};

/* -------------------------------------------------------
   PUBLIC: bulkCreateQuestionsFromJSON
   dataset: array loaded from file
   sourceFileName: original filename (for _faulty.json)
   options: see Options
------------------------------------------------------- */
export const bulkCreateQuestionsFromJSON = async (
  dataset: any[],
  sourceFileName: string,
  options: Options = {},
) => {
  const concurrency = options.concurrency ?? 5;
  const datasetDir = options.datasetDir ?? path.resolve(process.cwd(), 'src/question/dataset');
  ensureDir(datasetDir);

  const results = { total: 0, created: 0, failed: 0 };
  const faultyQuestions: any[] = [];

  // build refs only for required slugs
  const refs = await buildReferenceMapsForDataset(dataset, options);

  // prepare list of tasks (map dataset questions -> payloads)
  const tasks: { q: any; payload: any }[] = [];

  for (const subject of dataset) {
    for (const q of subject.questions || []) {
      results.total++;
      const { payload, missing } = mapQuestionUsingRefs(q, refs, options);

      if (!payload) {
        results.failed++;
        faultyQuestions.push({
          reason: 'Reference resolution failed or invalid data',
          missing,
          question_id: q.question_id,
          exam: q.exam,
          subject: q.subject,
          chapterGroup: q.chapterGroup,
          chapter: q.chapter,
          topic: q.topic ?? q.topicName,
          question: q,
        });
        continue;
      }

      tasks.push({ q, payload });
    }
  }

  // process payloads in chunks to control concurrency
  const chunks = chunkArray(tasks, concurrency);

  for (const chunk of chunks) {
    // run the chunk in parallel
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
          question: s.it.q,
        });
      }
    }
  }

  // write faulty file
  if (faultyQuestions.length > 0) {
    const faultyFilePath = path.join(datasetDir, sourceFileName.replace('.json', '_faulty.json'));
    fs.writeFileSync(faultyFilePath, JSON.stringify(faultyQuestions, null, 2), 'utf-8');
  }

  return { ...results, faultyCount: faultyQuestions.length, faultyFile: faultyQuestions.length > 0 ? path.join(datasetDir, sourceFileName.replace('.json', '_faulty.json')) : null };
};
