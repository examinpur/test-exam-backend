import questionServices from '../services/questionServices';
import chapterModel from '../../../models/chapterModel';
import topicModel from '../../../models/topicModel';
import paperModel from '../../../models/paperModel';
import questionCounterModel from '../../../models/questionCounterModel';
import { processAndUploadImages, mapImageIdsToCloudinary } from './imageZipProcessor';
import { CloudinaryImage } from './cloudinaryHelper';
import logger from '../../../utils/logger';

type Options = {
  concurrency?: number;
};

export const generateSlug = (text: string): string => {
  return String(text ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const chunkArray = <T>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const getNextQuestionId = async (): Promise<number> => {
  try {
    const counter = await questionCounterModel.findOneAndUpdate(
      {},
      { $inc: { count: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return counter.count;
  } catch (error: any) {
    logger.error(`Error getting next question ID: ${error?.message}`);
    throw error;
  }
};

const getBoardSlugFromExamGroup = (examGroup: string): string => {
  const normalized = String(examGroup ?? '').trim().toLowerCase();
  return normalized || 'jee';
};

const buildChapterPathKey = (q: any, subjectCtx?: any): string | null => {
  const examGroup = q?.examGroup ?? subjectCtx?.examGroup;
  const boardSlug = examGroup 
    ? getBoardSlugFromExamGroup(examGroup)
    : generateSlug(q?.boardSlug ?? subjectCtx?.boardSlug);
  const examSlug = generateSlug(q?.exam ?? q?.examSlug ?? subjectCtx?.exam ?? subjectCtx?.examSlug);
  const subjectSlug = generateSlug(q?.subject ?? q?.subjectSlug ?? subjectCtx?.subject ?? subjectCtx?.subjectSlug);
  const chapterGroupSlug = generateSlug(
    q?.chapterGroup ?? q?.chapterGroupSlug ?? subjectCtx?.chapterGroup ?? subjectCtx?.chapterGroupSlug,
  );
  const chapterSlug = generateSlug(q?.chapter ?? q?.chapterSlug);
  if (!boardSlug || !examSlug || !subjectSlug || !chapterGroupSlug || !chapterSlug) return null;
  return `${boardSlug}/${examSlug}/${subjectSlug}/${chapterGroupSlug}/${chapterSlug}`;
};

type ReferenceMaps = {
  chaptersByPathKey: Record<string, any>;
  chaptersBySlug: Record<string, any[]>;
  chaptersByName: Record<string, any[]>;
  topics: Record<string, any>;
  papers: Record<string, any>;
};

const buildReferenceMaps = async (dataset: any[]): Promise<ReferenceMaps> => {
  const chapterPathKeys = new Set<string>();
  const chapterSlugs = new Set<string>();
  const chapterNames = new Set<string>();
  const topicSlugs = new Set<string>();
  const paperSlugs = new Set<string>();

  const boardExamSubjectCombos = new Set<string>();

  for (const subject of dataset) {
    for (const q of subject?.questions || []) {
      const pk = q?.pathKey ? String(q.pathKey) : buildChapterPathKey(q, subject);
      if (pk) chapterPathKeys.add(pk);

      const chapterSlug = generateSlug(q?.chapter ?? q?.chapterSlug);
      if (chapterSlug) chapterSlugs.add(chapterSlug);

      const chapterName = q?.chapterNameForSearch || q?.chapter;
      if (chapterName && typeof chapterName === 'string') {
        const cleanName = chapterName.trim();
        if (cleanName) chapterNames.add(cleanName);
        const nameSlug = generateSlug(cleanName);
        if (nameSlug) chapterSlugs.add(nameSlug);
      }

      const examGroup = q?.examGroup ?? subject?.examGroup;
      const boardSlug = examGroup ? getBoardSlugFromExamGroup(examGroup) : null;
      const examSlug = generateSlug(q?.exam ?? q?.examSlug ?? subject?.exam ?? subject?.examSlug);
      const subjectSlug = generateSlug(q?.subject ?? q?.subjectSlug ?? subject?.subject ?? subject?.subjectSlug);
      if (boardSlug && examSlug && subjectSlug) {
        boardExamSubjectCombos.add(`${boardSlug}|${examSlug}|${subjectSlug}`);
      }

      const t1 = generateSlug(q?.topic);
      const t2 = generateSlug(q?.topicName);
      if (t1) topicSlugs.add(t1);
      if (t2) topicSlugs.add(t2);

      const p = generateSlug(q?.paperId);
      if (p) paperSlugs.add(p);
    }
  }

  const chapterQuery: any = { isActive: true };
  const or: any[] = [];

  if (chapterPathKeys.size > 0) or.push({ pathKey: { $in: Array.from(chapterPathKeys) } });
  if (chapterSlugs.size > 0) or.push({ slug: { $in: Array.from(chapterSlugs) } });
  
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

if (chapterNames.size > 0) {
  const nameArray = Array.from(chapterNames)
    .map((n) => n?.trim?.())
    .filter(Boolean)
    .map(escapeRegex);

  or.push({
    $or: nameArray.flatMap((name) => [
      { 'name.en': { $regex: new RegExp(name, 'i') } },
      { 'name.hi': { $regex: new RegExp(name, 'i') } },
    ]),
  });
}


  if (or.length > 0) chapterQuery.$or = or;
  else chapterQuery.slug = { $in: [] };

  const [chapters, topics, papers] = await Promise.all([
    or.length > 0 ? chapterModel.find(chapterQuery).lean() : Promise.resolve([]),
    topicSlugs.size > 0
      ? topicModel.find({ slug: { $in: Array.from(topicSlugs) }, isActive: true }).lean()
      : Promise.resolve([]),
    paperSlugs.size > 0
      ? paperModel.find({ slug: { $in: Array.from(paperSlugs) }, isActive: true }).lean()
      : Promise.resolve([]),
  ]);

  const chaptersByPathKey: Record<string, any> = {};
  const chaptersBySlug: Record<string, any[]> = {};
  const chaptersByName: Record<string, any[]> = {};

  for (const c of chapters as any[]) {
    if (c?.pathKey) chaptersByPathKey[String(c.pathKey)] = c;

    const s = String(c?.slug ?? '');
    if (s) {
      if (!chaptersBySlug[s]) chaptersBySlug[s] = [];
      chaptersBySlug[s].push(c);
    }
const enName = String(c?.name?.en ?? '').trim().toLowerCase();
if (enName) {
  if (!chaptersByName[enName]) chaptersByName[enName] = [];
  chaptersByName[enName].push(c);
}

const hiName = String(c?.name?.hi ?? '').trim().toLowerCase();
if (hiName) {
  if (!chaptersByName[hiName]) chaptersByName[hiName] = [];
  chaptersByName[hiName].push(c);
}

  }

  return {
    chaptersByPathKey,
    chaptersBySlug,
    chaptersByName,
    topics: Object.fromEntries((topics as any[]).map((t) => [t.slug, t])),
    papers: Object.fromEntries((papers as any[]).map((p) => [p.slug, p])),
  };
};

const transformOptions = (
  options: any[],
  uploadedImages: Map<string, CloudinaryImage> | undefined,
): any[] => {
  if (!options || !Array.isArray(options)) return [];

  return options.map((opt) => {
    const transformed: any = {
      identifier: opt.identifier,
      content: opt.content || '',
    };

    if (uploadedImages && opt.images && Array.isArray(opt.images) && opt.images.length > 0) {
      const mappedImages = mapImageIdsToCloudinary(opt.images, uploadedImages);
      if (mappedImages.length > 0) transformed.images = mappedImages;
    }

    return transformed;
  });
};

const buildLocalizedPrompt = (
  langData: any,
  uploadedImages: Map<string, CloudinaryImage> | undefined,
): any => {
  if (!langData) return undefined;

  const prompt: any = {
    content: langData.content ?? '',
    options: transformOptions(langData.options || [], uploadedImages),
  };

  if (langData.explanation) prompt.explanation = langData.explanation;

  if (uploadedImages && uploadedImages.size > 0) {
    if (langData.questionImages && Array.isArray(langData.questionImages) && langData.questionImages.length > 0) {
      const mappedImages = mapImageIdsToCloudinary(langData.questionImages, uploadedImages);
      if (mappedImages.length > 0) prompt.images = mappedImages;
    }

    if (
      langData.explanationImages &&
      Array.isArray(langData.explanationImages) &&
      langData.explanationImages.length > 0
    ) {
      const mappedImages = mapImageIdsToCloudinary(langData.explanationImages, uploadedImages);
      if (mappedImages.length > 0) prompt.explanationImages = mappedImages;
    }
  }

  return prompt;
};

const resolveChapter = (q: any, refs: ReferenceMaps, subjectCtx?: any) => {
  const chapterKey = q?.pathKey ? String(q.pathKey) : buildChapterPathKey(q, subjectCtx);

  if (chapterKey && refs.chaptersByPathKey[chapterKey]) {
    const chapter = refs.chaptersByPathKey[chapterKey];
    return { 
      chapter, 
      chapterKey, 
      chapterGroup: chapter?.chapterGroupSlug || null,
      missing: [] as string[] 
    };
  }

  const chapterSlug = generateSlug(q?.chapter ?? q?.chapterSlug);
  let candidates: any[] = [];

  if (chapterSlug) {
    candidates = refs.chaptersBySlug[chapterSlug] || [];
  }

  if (candidates.length === 0) {
    const chapterName = q?.chapterNameForSearch || q?.chapter;
    if (chapterName && typeof chapterName === 'string') {
      const cleanName = chapterName.trim().toLowerCase();
      if (cleanName) {
        candidates = refs.chaptersByName[cleanName] || [];
        
        if (candidates.length === 0) {
          for (const [name, chapters] of Object.entries(refs.chaptersByName)) {
            if (name.includes(cleanName) || cleanName.includes(name)) {
              candidates = chapters;
              break;
            }
          }
        }
      }
    }
  }

  if (candidates.length === 0) {
    return { 
      chapter: null, 
      chapterKey, 
      chapterGroup: null,
      missing: chapterSlug ? [`chapter_not_found:${chapterSlug}`] : ['missing_chapter_slug'] 
    };
  }

  if (candidates.length === 1) {
    const chapter = candidates[0];
    const examGroup = q?.examGroup ?? subjectCtx?.examGroup;
    const wantBoard = examGroup 
      ? getBoardSlugFromExamGroup(examGroup)
      : generateSlug(q?.boardSlug ?? subjectCtx?.boardSlug);
    const wantExam = generateSlug(q?.exam ?? subjectCtx?.exam ?? q?.examSlug ?? subjectCtx?.examSlug);
    
    const matches = (
      (!wantBoard || generateSlug(chapter?.boardSlug) === wantBoard) &&
      (!wantExam || generateSlug(chapter?.examSlug) === wantExam)
    );
    
    if (matches) {
      return { 
        chapter, 
        chapterKey, 
        chapterGroup: chapter?.chapterGroupSlug || null,
        missing: [] as string[] 
      };
    } else {
      return {
        chapter: null,
        chapterKey,
        chapterGroup: null,
        missing: [
          `chapter_mismatch:expected_${wantBoard}/${wantExam}_found_${chapter?.boardSlug}/${chapter?.examSlug}`,
        ],
      };
    }
  }

  if (candidates.length > 1) {
    const examGroup = q?.examGroup ?? subjectCtx?.examGroup;
    const wantBoard = examGroup 
      ? getBoardSlugFromExamGroup(examGroup)
      : generateSlug(q?.boardSlug ?? subjectCtx?.boardSlug);
    const wantExam = generateSlug(q?.exam ?? subjectCtx?.exam ?? q?.examSlug ?? subjectCtx?.examSlug);
  
    let narrowed = candidates.filter((c: any) => {
      return (
        generateSlug(c?.boardSlug) === wantBoard &&
        generateSlug(c?.examSlug) === wantExam
      );
    });
  
    if (narrowed.length === 1) {
      const chapter = narrowed[0];
      return { 
        chapter, 
        chapterKey, 
        chapterGroup: chapter?.chapterGroupSlug || null,
        missing: [] as string[] 
      };
    }
    if (narrowed.length > 1) {
      const wantSub = generateSlug(q?.subject ?? subjectCtx?.subject ?? q?.subjectSlug ?? subjectCtx?.subjectSlug);
      const subjectNarrowed = narrowed.filter((c: any) => 
        generateSlug(c?.subjectSlug) === wantSub
      );
      
      if (subjectNarrowed.length === 1) {
        const chapter = subjectNarrowed[0];
        return { 
          chapter, 
          chapterKey, 
          chapterGroup: chapter?.chapterGroupSlug || null,
          missing: [] as string[] 
        };
      }
      if (subjectNarrowed.length > 0) {
        const chapter = subjectNarrowed[0];
        return { 
          chapter, 
          chapterKey, 
          chapterGroup: chapter?.chapterGroupSlug || null,
          missing: [`ambiguous_chapter_slug:${chapterSlug}`, 'using_first_match'] 
        };
      }
    }
  
    if (narrowed.length > 0) {
      const chapter = narrowed[0];
      return { 
        chapter, 
        chapterKey, 
        chapterGroup: chapter?.chapterGroupSlug || null,
        missing: [`ambiguous_chapter_slug:${chapterSlug}`, 'using_first_match'] 
      };
    }
    
    return {
      chapter: null,
      chapterKey,
      chapterGroup: null,
      missing: [
        `chapter_not_found_for_combination:${wantBoard}/${wantExam}`,
        `available_candidates:${candidates.length}`,
      ],
    };
  }

  return { 
    chapter: null, 
    chapterKey, 
    chapterGroup: null,
    missing: [`chapter_not_found:${chapterKey ?? chapterSlug ?? 'unknown'}`] 
  };
};
const buildQuestionSlugAndPath = (args: {
  q: any;
  chapter: any;
  topicSlug?: string;
  questionId?: number;
}) => {
  const { q, chapter, questionId } = args;
  const topicSlug = args.topicSlug ? generateSlug(args.topicSlug) : undefined;

  const questionSlug = questionId !== undefined
    ? `q${questionId.toString().padStart(6, '0')}`
    : generateSlug(q?.question_id) ||
      generateSlug(q?.slug) ||
      generateSlug(q?.permalink?.replace(/\.html?$/i, '')) ||
      generateSlug(q?.question?.en?.content) ||
      'untitled';

  const boardSlug = String(chapter.boardSlug);
  const examSlug = String(chapter.examSlug);
  const subjectSlug = String(chapter.subjectSlug);
  const chapterGroupSlug = String(chapter.chapterGroupSlug);
  const chapterSlug = String(chapter.slug);

  const pathSlugs = [
    boardSlug,
    examSlug,
    subjectSlug,
    chapterGroupSlug,
    chapterSlug,
    ...(topicSlug ? [topicSlug] : []),
    questionSlug,
  ];

  const pathKey = pathSlugs.join('/');

  return {
    questionSlug,
    boardSlug,
    examSlug,
    subjectSlug,
    chapterGroupSlug,
    chapterSlug,
    topicSlug,
    pathSlugs,
    pathKey,
  };
};

const mapQuestionToPayload = async (
  q: any,
  refs: ReferenceMaps,
  uploadedImages: Map<string, CloudinaryImage> | undefined,
  subjectCtx?: any,
): Promise<{ payload: any | null; missing: string[] }> => {
  const kindMap: Record<string, string> = {
    mcq: 'MCQ',
    msq: 'MSQ',
    integer: 'INTEGER',
    fill_blank: 'FILL_BLANK',
    true_false: 'TRUE_FALSE',
  };
   
  const kind = kindMap[String(q.type ?? '').toLowerCase()];
  if (!kind) return { payload: null, missing: ['unsupported_kind'] };

  if (kind === 'INTEGER' && q.question?.en?.answer == null) {
    return { payload: null, missing: ['missing_integer_answer'] };
  }

  const { chapter, chapterKey, chapterGroup, missing: chapterMissing } = resolveChapter(q, refs, subjectCtx);
  
  if (!chapter) {
    return { 
      payload: null, 
      missing: chapterMissing 
    };
  }
    if (chapterGroup && !q.chapterGroup) {
    q.chapterGroup = chapterGroup;
  }

  const topicSlugRaw = q.topic ?? q.topicName;
  const topicSlugNorm = topicSlugRaw ? generateSlug(topicSlugRaw) : undefined;
  const topic = topicSlugNorm ? refs.topics[topicSlugNorm] : undefined;

  const paperSlugRaw = q.paperId;
  const paperSlugNorm = paperSlugRaw ? generateSlug(paperSlugRaw) : undefined;
  const paper = paperSlugNorm ? refs.papers[paperSlugNorm] : undefined;

  const missing: string[] = [];
  if (!chapter.boardId) missing.push('boardId_from_chapter');
  if (!chapter.examId) missing.push('examId_from_chapter');
  if (!chapter.subjectId) missing.push('subjectId_from_chapter');
  if (!chapter.chapterGroupId) missing.push('chapterGroupId_from_chapter');
  if (missing.length > 0) return { payload: null, missing };

  // Get next question ID from global counter
  let questionId: number;
  try {
    questionId = await getNextQuestionId();
  } catch (error: any) {
    logger.error(`Failed to get next question ID: ${error?.message}`);
    return { payload: null, missing: ['failed_to_get_question_id'] };
  }

  const name = q.question?.en?.content
    ? String(q.question.en.content).slice(0, 80)
    : q.permalink ?? 'untitled';

  const enPrompt = buildLocalizedPrompt(q.question?.en, uploadedImages);
  const hiPrompt = buildLocalizedPrompt(q.question?.hi, uploadedImages);

  const finalTopicSlug = topic?.slug || topicSlugNorm; 
  const slugAndPath = buildQuestionSlugAndPath({
    q,
    chapter,
    topicSlug: finalTopicSlug,
    questionId,
  });

  const payload: any = {
    boardId: chapter.boardId,
    examId: chapter.examId,
    subjectId: chapter.subjectId,
    chapterGroupId: chapter.chapterGroupId,
    chapterId: chapter._id,
    topicId: topic?._id || undefined,
    paperRefId: paper?._id || undefined,
    paperId: paper?.slug || paperSlugNorm || undefined,
    boardSlug: slugAndPath.boardSlug,
    examSlug: slugAndPath.examSlug,
    subjectSlug: slugAndPath.subjectSlug,
    chapterGroupSlug: slugAndPath.chapterGroupSlug,
    chapterSlug: slugAndPath.chapterSlug,
    topicSlug: slugAndPath.topicSlug || undefined,
    slug: slugAndPath.questionSlug,
    pathSlugs: slugAndPath.pathSlugs,
    pathKey: slugAndPath.pathKey,
    kind,
    name,
    marks: typeof q.marks === 'number' ? q.marks : undefined,
    negMarks: typeof q.negMarks === 'number' ? q.negMarks : undefined,
    difficulty: q.difficulty,
    calculator: false,

    prompt: {
      en: enPrompt,
      ...(hiPrompt ? { hi: hiPrompt } : {}),
    },

    correct:
      kind === 'INTEGER'
        ? { integer: Number(q.question.en.answer) }
        : { identifiers: q.question.en.correct_options ?? [] },

    year: q.year,
    yearKey: q.yearKey,
    section: q.section ?? [],
    tags: finalTopicSlug ? [finalTopicSlug] : [],
    _resolvedChapterPathKey: chapterKey,
  };

  return { payload, missing: [] };
};

export const bulkCreateQuestions = async (
  dataset: any[],
  zipBuffer?: Buffer,
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
      imagesUploaded: 0,
      error: 'Invalid or empty dataset provided',
    };
  }

  let uploadedImages: Map<string, CloudinaryImage> | undefined;
  if (zipBuffer && zipBuffer.length > 0) {
    try {
      logger.info('Processing image zip file...');
      uploadedImages = await processAndUploadImages(zipBuffer, 'question-images');
      logger.info(`Processed ${uploadedImages.size} images from zip`);
    } catch (error: any) {
      logger.error(`Error processing zip file: ${error?.message}`);
    }
  }

  const results = { total: 0, created: 0, failed: 0 };
  const faultyQuestions: any[] = [];

  const refs = await buildReferenceMaps(dataset);

  const tasks: { q: any; payload: any; subjectCtx?: any }[] = [];

  for (const subject of dataset) {
    for (const q of subject?.questions || []) {
      results.total++;

      const { payload, missing } = await mapQuestionToPayload(q, refs, uploadedImages, subject);

      if (!payload) {
        results.failed++;
        faultyQuestions.push({
          reason: 'Reference resolution failed or invalid data',
          missing,
          question_id: q.question_id,
          chapter: q.chapter,
          chapterNameForSearch: q.chapterNameForSearch,
          chapterPathKey: q.pathKey ?? buildChapterPathKey(q, subject),
          topic: q.topic ?? q.topicName,
          paperId: q.paperId,
          examGroup: q.examGroup,
          exam: q.exam,
          subject: q.subject,
          chapterGroup: q.chapterGroup,
        });
        continue;
      }

      tasks.push({ q, payload, subjectCtx: subject });
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
    imagesUploaded: uploadedImages?.size ?? 0,
  };
};
