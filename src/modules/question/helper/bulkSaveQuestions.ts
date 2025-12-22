import questionServices from '../services/questionServices';
import chapterModel from '../../../models/chapterModel';
import topicModel from '../../../models/topicModel';
import paperModel from '../../../models/paperModel';
import { processAndUploadImages, mapImageIdsToCloudinary } from './imageZipProcessor';
import { CloudinaryImage } from './cloudinaryHelper';
import logger from '../../../utils/logger';

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

/**
 * Transform options - only add images field if images exist
 */
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

    // Only add images if zip was provided and images exist for this option
    if (uploadedImages && opt.images && Array.isArray(opt.images) && opt.images.length > 0) {
      const mappedImages = mapImageIdsToCloudinary(opt.images, uploadedImages);
      if (mappedImages.length > 0) {
        transformed.images = mappedImages;
      }
    }

    return transformed;
  });
};

/**
 * Build localized prompt - only adds image fields when images exist
 */
const buildLocalizedPrompt = (
  langData: any,
  uploadedImages: Map<string, CloudinaryImage> | undefined,
): any => {
  if (!langData) return undefined;

  const prompt: any = {
    content: langData.content ?? '',
    options: transformOptions(langData.options || [], uploadedImages),
  };

  // Only add explanation if it exists
  if (langData.explanation) {
    prompt.explanation = langData.explanation;
  }

  // Only add image fields if zip was provided and images exist
  if (uploadedImages && uploadedImages.size > 0) {
    // Add question images if they exist in the data and in uploaded images
    if (langData.questionImages && Array.isArray(langData.questionImages) && langData.questionImages.length > 0) {
      const mappedImages = mapImageIdsToCloudinary(langData.questionImages, uploadedImages);
      if (mappedImages.length > 0) {
        prompt.images = mappedImages;
      }
    }

    // Add explanation images if they exist
    if (langData.explanationImages && Array.isArray(langData.explanationImages) && langData.explanationImages.length > 0) {
      const mappedImages = mapImageIdsToCloudinary(langData.explanationImages, uploadedImages);
      if (mappedImages.length > 0) {
        prompt.explanationImages = mappedImages;
      }
    }
  }

  return prompt;
};

/**
 * Map question data to payload - preserves original flow, adds images only when provided
 */
const mapQuestionToPayload = (
  q: any,
  refs: any,
  uploadedImages: Map<string, CloudinaryImage> | undefined,
) => {
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

  // Build prompts - only adds image fields when images exist
  const enPrompt = buildLocalizedPrompt(q.question?.en, uploadedImages);
  const hiPrompt = buildLocalizedPrompt(q.question?.hi, uploadedImages);

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
    tags: topicSlug ? [topicSlug] : [],
  };

  return { payload, missing: [] };
};

/**
 * Bulk create questions with optional image zip file
 * @param dataset - Array of subject objects containing questions
 * @param zipBuffer - Optional zip file buffer containing images
 * @param options - Options like concurrency
 */
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

  // Process and upload images only if zip is provided
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

  const tasks: { q: any; payload: any }[] = [];

  for (const subject of dataset) {
    for (const q of subject.questions || []) {
      results.total++;
      const { payload, missing } = mapQuestionToPayload(q, refs, uploadedImages);

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
    imagesUploaded: uploadedImages?.size ?? 0,
  };
};
