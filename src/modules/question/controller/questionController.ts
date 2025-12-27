import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import questionServices from '../services/questionServices';
import { validateQuestion, validateQuestionUpdate } from '../validation/questionValidator';
import { bulkCreateQuestions } from '../helper/bulkSaveQuestions';
import { parseQuestionFile, cleanupFile } from '../helper/parseQuestionFile';
import { importQuestionsFromFile } from '../helper/importQuestionsFromFile';
import { importQuestionsFromMarkdown } from '../helper/importFromMarkdown';
import { generateSlug } from '../../../utils/slug';

const createQuestion = async (req: Request, res: Response) => {
  try {
    const validation = validateQuestion(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await questionServices.createQuestion(req.body);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in createQuestion controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const updateQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const validation = validateQuestionUpdate(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await questionServices.updateQuestion(id, req.body);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in updateQuestion controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getQuestions = async (req: Request, res: Response) => {
  try {
    const { pathKey, chapterId, topicId, comprehensionId, paperId } = req.query;

    let result;
    if (pathKey) {
      result = await questionServices.getQuestionByPathKey(pathKey as string);
    } else if (chapterId) {
      result = await questionServices.getQuestionsByChapterId(chapterId as string);
    } else if (topicId) {
      result = await questionServices.getQuestionsByTopicId(topicId as string);
    } else if (comprehensionId) {
      result = await questionServices.getQuestionsByComprehensionId(comprehensionId as string);
    } else if (paperId) {
      result = await questionServices.getQuestionsByPaperId(paperId as string);
    } else {
      result = await questionServices.getAllQuestions();
    }

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getQuestions controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await questionServices.getQuestionById(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getQuestion controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await questionServices.deleteQuestion(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in deleteQuestion controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const bulkCreateQuestion = async (req: Request, res: Response) => {
  let jsonFilePath: string | undefined;
  let zipFilePath: string | undefined;

  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const jsonFile = files?.questions?.[0] || req.file;
    const zipFile = files?.images?.[0];

    if (!jsonFile) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'No questions file uploaded. Please upload a JSON file.',
      });
    }

    jsonFilePath = jsonFile.path;
    zipFilePath = zipFile?.path;

    const data = await parseQuestionFile(jsonFilePath);

    if (!data || !Array.isArray(data) || data.length === 0) {
      if (jsonFilePath) cleanupFile(jsonFilePath);
      if (zipFilePath) cleanupFile(zipFilePath);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'File must contain a non-empty array',
      });
    }

    let zipBuffer: Buffer | undefined;
    if (zipFilePath) {
      const fs = await import('fs');
      zipBuffer = fs.readFileSync(zipFilePath);
    }
    // const data = await parseQuestionFile(jsonFilePath);
   const normalized = normalizeBulkUpload(data);
    const result = await bulkCreateQuestions(normalized, zipBuffer);

    if (jsonFilePath) cleanupFile(jsonFilePath);
    if (zipFilePath) cleanupFile(zipFilePath);

    if (result.error) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Bulk create completed. Created: ${result.created}, Failed: ${result.failed}, Images uploaded: ${result.imagesUploaded}`,
      data: result,
    });
  } catch (error: any) {
    if (jsonFilePath) cleanupFile(jsonFilePath);
    if (zipFilePath) cleanupFile(zipFilePath);

    logger.error(`Error occurred in bulkCreateQuestion controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const importQuestionsFromDataset = async (req: Request, res: Response) => {
  let filePath: string | undefined;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'No file uploaded. Please upload a JSON file with question dataset.',
      });
    }

    filePath = file.path;

    const result = await importQuestionsFromFile(filePath);

    cleanupFile(filePath);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Import completed. Created: ${result.created}, Failed: ${result.failed}, Skipped: ${result.skipped}`,
      data: result,
    });
  } catch (error: any) {
    if (filePath) cleanupFile(filePath);

    logger.error(`Error occurred in importQuestionsFromDataset controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const importQuestionsFromMarkdownFile = async (req: Request, res: Response) => {
  let filePath: string | undefined;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'No markdown file uploaded. Please upload a .md file with questions.',
      });
    }

    filePath = file.path;

    // Get template from request body - can be sent as 'data' JSON string or individual fields
    let chapter, topic, marks, negMarks, difficulty, type, paperId, year, yearKey, section, correctAnswers;

    if (req.body.data) {
      // Parse JSON from 'data' field
      const data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
      chapter = data.chapter;
      topic = data.topic;
      marks = data.marks;
      negMarks = data.negMarks;
      difficulty = data.difficulty;
      type = data.type;
      paperId = data.paperId;
      year = data.year;
      yearKey = data.yearKey;
      section = data.section;
      correctAnswers = data.correctAnswers;
    } else {
      // Get individual fields
      chapter = req.body.chapter;
      topic = req.body.topic;
      marks = req.body.marks;
      negMarks = req.body.negMarks;
      difficulty = req.body.difficulty;
      type = req.body.type;
      paperId = req.body.paperId;
      year = req.body.year;
      yearKey = req.body.yearKey;
      section = req.body.section;
      correctAnswers = req.body.correctAnswers;
    }

    if (!chapter) {
      cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'chapter slug is required in request body.',
      });
    }

    const template = {
      chapter,
      topic,
      marks: marks ? (typeof marks === 'number' ? marks : parseInt(marks, 10)) : 4,
      negMarks: negMarks ? (typeof negMarks === 'number' ? negMarks : parseInt(negMarks, 10)) : 1,
      difficulty: difficulty || 'easy',
      type: type || 'mcq',
      paperId,
      year: year ? (typeof year === 'number' ? year : parseInt(year, 10)) : undefined,
      yearKey,
      section: section ? (typeof section === 'string' ? JSON.parse(section) : section) : [],
    };

    // Parse correctAnswers if provided (format: {"1": ["A"], "2": ["B"], ...})
    const parsedCorrectAnswers = correctAnswers
      ? (typeof correctAnswers === 'string' ? JSON.parse(correctAnswers) : correctAnswers)
      : undefined;

    const result = await importQuestionsFromMarkdown(filePath, template, parsedCorrectAnswers);

    // Cleanup file
    cleanupFile(filePath);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Import completed. Created: ${result.created}, Failed: ${result.failed}`,
      data: result,
    });
  } catch (error: any) {
    if (filePath) cleanupFile(filePath);

    logger.error(`Error occurred in importQuestionsFromMarkdownFile controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const questionController = {
  createQuestion,
  updateQuestion,
  getQuestions,
  getQuestion,
  deleteQuestion,
  bulkCreateQuestion,
  importQuestionsFromDataset,
  importQuestionsFromMarkdownFile,
};

export default questionController;


type OldDataset = Array<{
  _id: string;
  title: string;
  questions: any[];
}>;

const normalizeSubject = (raw: string): string => {
  const s = String(raw ?? '').trim().toLowerCase();

  if (['math', 'maths', 'mathematics'].includes(s)) return 'mathematics';
  if (['phy', 'physics'].includes(s)) return 'physics';
  if (['che', 'chem', 'chemistry'].includes(s)) return 'chemistry';

  // fallback: keep as slug-ish text
  return s || 'unknown';
};

const stripChapterPrefix = (raw: string): string => {
  // "17. Vector Algebra" -> "Vector Algebra"
  return String(raw ?? '')
    .replace(/^\s*\d+\s*[\.\-:)]*\s*/g, '')
    .trim();
};

const normalizeDifficulty = (raw: string): 'easy' | 'medium' | 'hard' => {
  const s = String(raw ?? '').trim().toLowerCase();
  if (s.includes('easy')) return 'easy';
  if (s.includes('hard')) return 'hard';
  return 'medium';
};

const normalizeType = (raw: string): 'mcq' | 'msq' | 'integer' | 'true_false' | 'fill_blank' => {
  const s = String(raw ?? '').trim().toLowerCase();

  if (s.includes('single') && s.includes('mcq')) return 'mcq';
  if (s.includes('multi') && s.includes('mcq')) return 'msq';

  if (s.includes('integer')) return 'integer';
  if (s.includes('true') && s.includes('false')) return 'true_false';
  if (s.includes('fill')) return 'fill_blank';
   
  // default safe
  return 'mcq';
};

const extractYearFromTopic = (raw: string): number | undefined => {
  const m = String(raw ?? '').match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : undefined;
};

const parseClassList = (raw: string): string[] => {
  // "JEE MAIN + NEET + JEE ADVANCED"
  return String(raw ?? '')
    .split('+')
    .map((x) => x.trim())
    .filter(Boolean);
};

const examVariantMap = (label: string): { examGroup: string; exam: string } | null => {
  const s = String(label).trim().toUpperCase();

  if (s === 'JEE MAIN') return { examGroup: 'jee', exam: 'jee-main' };
  if (s === 'JEE ADVANCED') return { examGroup: 'jee', exam: 'jee-advanced' };
  if (s === 'NEET') return { examGroup: 'medical', exam: 'neet' };

  return null;
};

export const normalizeBulkUpload = (input: any): OldDataset => {
  if (!Array.isArray(input)) throw new Error('Uploaded JSON must be an array');
  if (input.length === 0) return [];

  const hasWrapper = Array.isArray(input[0]?.questions);

  const firstQuestion = hasWrapper
    ? input.find((x: any) => Array.isArray(x?.questions) && x.questions.length > 0)?.questions?.[0]
    : input[0];

  if (!firstQuestion) {
    return hasWrapper ? (input as OldDataset) : [];
  }

  const isNew = Object.prototype.hasOwnProperty.call(firstQuestion, 'metadata');

  // ✅ old dataset, return as-is
  if (!isNew) return input as OldDataset;

  // ✅ NEW dataset: unwrap if needed
  const flatInput = hasWrapper ? input.flatMap((x: any) => x.questions || []) : input;

  const first = flatInput[0];
  const looksNew =
    first &&
    typeof first === 'object' &&
    ('question_text' in first || 'metadata' in first || 'options' in first);

  if (!looksNew) throw new Error('Unknown JSON format');

  const bySubject: Record<string, { _id: string; title: string; questions: any[] }> = {};

  for (const item of flatInput) {
    const meta = item?.metadata || {};

    const subjectNorm = normalizeSubject(meta.subject);
    const subjectTitle =
      subjectNorm === 'mathematics'
        ? 'Mathematics'
        : subjectNorm === 'physics'
          ? 'Physics'
          : subjectNorm === 'chemistry'
            ? 'Chemistry'
            : subjectNorm;

    if (!bySubject[subjectNorm]) {
      bySubject[subjectNorm] = { _id: subjectTitle, title: subjectTitle, questions: [] };
    }

    // Handle chapter: strip prefix and create slug, but also keep original for searching
    const chapterRaw = String(meta.chapter ?? '').trim();
    const chapterClean = stripChapterPrefix(chapterRaw);
    const chapterValue = generateSlug(chapterClean) || generateSlug(chapterRaw) || null;
    // Store original chapter name for searching
    const chapterNameForSearch = chapterClean || chapterRaw || null;

    const topicRaw = String(meta.topic ?? '').trim();
    const year = extractYearFromTopic(topicRaw);

    const type = normalizeType(meta.question_type);
    const difficulty = normalizeDifficulty(meta.level);

    const options = Array.isArray(item?.options) ? item.options : [];
    const mappedOptions = options.map((o: any) => ({
      identifier: String(o?.option_letter ?? '').toUpperCase(),
      content: o?.option_text ?? '',
      images: Array.isArray(o?.option_images) ? o.option_images : [],
    }));

    const correctOptions = options
      .filter((o: any) => o?.is_correct)
      .map((o: any) => String(o?.option_letter ?? '').toUpperCase())
      .filter(Boolean);

    const questionBlock = {
      en: {
        content: item?.question_text ?? '',
        questionImages: Array.isArray(item?.question_images) ? item.question_images : [],
        options: mappedOptions,
        correct_options: correctOptions.length > 0 ? correctOptions : [],
        explanation: item?.solution_text ?? '',
        explanationImages: Array.isArray(item?.solution_images) ? item.solution_images : [],
      },
    };

    const qid = String(item?.question_id ?? '').trim();
    const permalink = qid ? `${qid}.htm` : undefined;

    const classList = parseClassList(meta.class);
    const variants = classList
      .map(examVariantMap)
      .filter((x): x is { examGroup: string; exam: string } => Boolean(x));

    const finalVariants = variants.length > 0 ? variants : [{ examGroup: 'jee', exam: 'jee-main' }];

    for (const v of finalVariants) {
      bySubject[subjectNorm].questions.push({
        country: 'in',
        examGroup: v.examGroup,
        exam: v.exam,
        question_id: qid || undefined,
        marks: 4,
        negMarks: 1,
        subject: subjectNorm,
        chapter: chapterValue,
        chapterNameForSearch: chapterNameForSearch, // Add this for chapter search by name
        topic: topicRaw || undefined,
        type, // must be "mcq"/"msq"/...
        difficulty,
        year: year || undefined,
        yearKey: year ? `${generateSlug(v.exam)}-${subjectNorm}-${year}` : undefined,
        languages: ['en'],
        question: questionBlock,
        permalink,
        section: ['chapter'],
        paperId: undefined,
        chapterGroup: undefined, // Will be resolved from chapter lookup
      });
    }
  }

  return Object.values(bySubject);
};

