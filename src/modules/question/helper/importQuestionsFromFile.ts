import fs from 'fs';
import path from 'path';
import { generateSlug } from '../../../utils/slug';
import Board from '../../../models/boardModel';
import Exam from '../../../models/examModel';
import Subject from '../../../models/subjectModel';
import ChapterGroup from '../../../models/chapterGroupModel';
import Chapter from '../../../models/chapterModel';
import Topic from '../../../models/topicModel';
import Question from '../../../models/questionModel';
import logger from '../../../utils/logger';

interface RawQuestionOption {
  option_letter: string;
  option_text: string;
  option_images: string[];
  is_correct: boolean;
}

interface RawQuestion {
  question_id: number;
  question_text: string;
  question_images: string[];
  solution_text: string;
  solution_images: string[];
  metadata: {
    class: string;
    subject: string;
    chapter: string;
    topic: string;
    level: string;
    question_type: string;
  };
  options: RawQuestionOption[];
}

interface ImportResult {
  totalQuestions: number;
  created: number;
  failed: number;
  skipped: number;
  entitiesCreated: {
    boards: number;
    exams: number;
    subjects: number;
    chapterGroups: number;
    chapters: number;
    topics: number;
  };
  errors: Array<{
    questionId: number;
    board: string;
    reason: string;
  }>;
}

// Parse the class field to extract board names
// e.g., "JEE MAIN + NEET + JEE ADVANCED" -> ["JEE MAIN", "NEET", "JEE ADVANCED"]
const parseBoardsFromClass = (classField: string): string[] => {
  if (!classField) return [];
  return classField
    .split('+')
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
};

// Get board name for creating (use the exam name as board name for simplicity)
// "JEE MAIN" -> "JEE" board
// "NEET" -> "NEET" board
const getBoardNameFromExamName = (examName: string): string => {
  const normalized = examName.toUpperCase();
  if (normalized.includes('JEE')) {
    return 'JEE';
  }
  if (normalized.includes('NEET')) {
    return 'NEET';
  }
  // Default: use the exam name as board name
  return examName;
};

// Map question_type to kind
const mapQuestionTypeToKind = (questionType: string): string | null => {
  if (!questionType) return 'MCQ';
  const normalized = questionType.toLowerCase();
  if (normalized.includes('single') && normalized.includes('mcq')) {
    return 'MCQ';
  }
  if (normalized.includes('multiple') || normalized.includes('msq')) {
    return 'MSQ';
  }
  if (normalized.includes('integer') || normalized.includes('numerical')) {
    return 'INTEGER';
  }
  if (normalized.includes('true') || normalized.includes('false')) {
    return 'TRUE_FALSE';
  }
  if (normalized.includes('fill')) {
    return 'FILL_BLANK';
  }
  if (normalized.includes('comprehension') || normalized.includes('passage')) {
    return 'COMPREHENSION_PASSAGE';
  }
  return 'MCQ';
};

// Map level to difficulty
const mapLevelToDifficulty = (level: string): 'easy' | 'medium' | 'hard' => {
  if (!level) return 'easy';
  const normalized = level.toLowerCase();
  if (normalized.includes('hard') || normalized.includes('difficult')) {
    return 'hard';
  }
  if (normalized.includes('medium') || normalized.includes('moderate')) {
    return 'medium';
  }
  return 'easy';
};

// Transform raw options to the schema format
const transformOptions = (
  options: RawQuestionOption[],
): { options: Array<{ identifier: string; content: string; images: any[] }>; correctIdentifiers: string[] } => {
  const transformed: Array<{ identifier: string; content: string; images: any[] }> = [];
  const correctIdentifiers: string[] = [];

  for (const opt of options || []) {
    const identifier = opt.option_letter?.toUpperCase() || String.fromCharCode(65 + transformed.length);
    transformed.push({
      identifier,
      content: opt.option_text || '',
      images: (opt.option_images || []).map((url) => ({ url })),
    });
    if (opt.is_correct) {
      correctIdentifiers.push(identifier);
    }
  }

  return { options: transformed, correctIdentifiers };
};

// Find or create board
const findOrCreateBoard = async (examName: string, entitiesCreated: ImportResult['entitiesCreated']) => {
  const boardName = getBoardNameFromExamName(examName);
  const boardSlug = generateSlug(boardName);

  let board = await Board.findOne({ slug: boardSlug }).lean();
  if (!board) {
    const maxOrderBoard = await Board.findOne().sort({ order: -1 });
    const nextOrder = maxOrderBoard ? (maxOrderBoard.order || 0) + 1 : 0;

    board = await Board.create({
      name: boardName,
      slug: boardSlug,
      order: nextOrder,
      isActive: true,
    });
    entitiesCreated.boards++;
    logger.info(`Created board: ${boardName} (${boardSlug})`);
  }
  return board;
};

// Find or create exam
const findOrCreateExam = async (
  boardId: string,
  boardSlug: string,
  examName: string,
  entitiesCreated: ImportResult['entitiesCreated'],
) => {
  const examSlug = generateSlug(examName);

  let exam = await Exam.findOne({ boardId, slug: examSlug }).lean();
  if (!exam) {
    const maxOrderExam = await Exam.findOne({ boardId }).sort({ order: -1 });
    const nextOrder = maxOrderExam ? (maxOrderExam.order || 0) + 1 : 0;

    const pathSlugs = [boardSlug, examSlug];
    const pathKey = `${boardSlug}/${examSlug}`;

    exam = await Exam.create({
      boardId,
      name: examName,
      slug: examSlug,
      order: nextOrder,
      isActive: true,
      boardSlug,
      pathSlugs,
      pathKey,
    });
    entitiesCreated.exams++;
    logger.info(`Created exam: ${examName} (${examSlug})`);
  }
  return exam;
};

// Find or create subject
const findOrCreateSubject = async (
  boardId: string,
  examId: string,
  boardSlug: string,
  examSlug: string,
  subjectName: string,
  entitiesCreated: ImportResult['entitiesCreated'],
) => {
  const subjectSlug = generateSlug(subjectName);

  let subject = await Subject.findOne({ examId, slug: subjectSlug }).lean();
  if (!subject) {
    const maxOrderSubject = await Subject.findOne({ examId }).sort({ order: -1 });
    const nextOrder = maxOrderSubject ? (maxOrderSubject.order || 0) + 1 : 0;

    const pathSlugs = [boardSlug, examSlug, subjectSlug];
    const pathKey = `${boardSlug}/${examSlug}/${subjectSlug}`;

    subject = await Subject.create({
      boardId,
      examId,
      name: subjectName,
      slug: subjectSlug,
      order: nextOrder,
      isActive: true,
      boardSlug,
      examSlug,
      pathSlugs,
      pathKey,
    });
    entitiesCreated.subjects++;
    logger.info(`Created subject: ${subjectName} (${subjectSlug})`);
  }
  return subject;
};

// Find or create chapter group
const findOrCreateChapterGroup = async (
  boardId: string,
  examId: string,
  subjectId: string,
  boardSlug: string,
  examSlug: string,
  subjectSlug: string,
  chapterGroupName: string,
  entitiesCreated: ImportResult['entitiesCreated'],
) => {
  const chapterGroupSlug = generateSlug(chapterGroupName);

  let chapterGroup = await ChapterGroup.findOne({ subjectId, slug: chapterGroupSlug }).lean();
  if (!chapterGroup) {
    const maxOrderCG = await ChapterGroup.findOne({ subjectId }).sort({ order: -1 });
    const nextOrder = maxOrderCG ? (maxOrderCG.order || 0) + 1 : 0;

    const pathSlugs = [boardSlug, examSlug, subjectSlug, chapterGroupSlug];
    const pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterGroupSlug}`;

    chapterGroup = await ChapterGroup.create({
      boardId,
      examId,
      subjectId,
      name: chapterGroupName,
      slug: chapterGroupSlug,
      order: nextOrder,
      isActive: true,
      boardSlug,
      examSlug,
      subjectSlug,
      pathSlugs,
      pathKey,
    });
    entitiesCreated.chapterGroups++;
    logger.info(`Created chapter group: ${chapterGroupName} (${chapterGroupSlug})`);
  }
  return chapterGroup;
};

// Find or create chapter
const findOrCreateChapter = async (
  boardId: string,
  examId: string,
  subjectId: string,
  chapterGroupId: string,
  boardSlug: string,
  examSlug: string,
  subjectSlug: string,
  chapterGroupSlug: string,
  chapterName: string,
  entitiesCreated: ImportResult['entitiesCreated'],
) => {
  const chapterSlug = generateSlug(chapterName);

  let chapter = await Chapter.findOne({ chapterGroupId, slug: chapterSlug }).lean();
  if (!chapter) {
    const maxOrderChapter = await Chapter.findOne({ chapterGroupId }).sort({ order: -1 });
    const nextOrder = maxOrderChapter ? (maxOrderChapter.order || 0) + 1 : 0;

    const pathSlugs = [boardSlug, examSlug, subjectSlug, chapterGroupSlug, chapterSlug];
    const pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterGroupSlug}/${chapterSlug}`;

    chapter = await Chapter.create({
      boardId,
      examId,
      subjectId,
      chapterGroupId,
      name: chapterName,
      slug: chapterSlug,
      order: nextOrder,
      isActive: true,
      boardSlug,
      examSlug,
      subjectSlug,
      chapterGroupSlug,
      pathSlugs,
      pathKey,
    });
    entitiesCreated.chapters++;
    logger.info(`Created chapter: ${chapterName} (${chapterSlug})`);
  }
  return chapter;
};

// Find or create topic
const findOrCreateTopic = async (
  boardId: string,
  examId: string,
  subjectId: string,
  chapterGroupId: string,
  chapterId: string,
  boardSlug: string,
  examSlug: string,
  subjectSlug: string,
  chapterGroupSlug: string,
  chapterSlug: string,
  topicName: string,
  entitiesCreated: ImportResult['entitiesCreated'],
) => {
  if (!topicName) return null;

  const topicSlug = generateSlug(topicName);
  if (!topicSlug) return null;

  let topic = await Topic.findOne({ chapterId, slug: topicSlug }).lean();
  if (!topic) {
    const maxOrderTopic = await Topic.findOne({ chapterId }).sort({ order: -1 });
    const nextOrder = maxOrderTopic ? (maxOrderTopic.order || 0) + 1 : 0;

    const pathSlugs = [boardSlug, examSlug, subjectSlug, chapterGroupSlug, chapterSlug, topicSlug];
    const pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterGroupSlug}/${chapterSlug}/${topicSlug}`;

    topic = await Topic.create({
      boardId,
      examId,
      subjectId,
      chapterGroupId,
      chapterId,
      name: topicName,
      slug: topicSlug,
      order: nextOrder,
      isActive: true,
      boardSlug,
      examSlug,
      subjectSlug,
      chapterGroupSlug,
      chapterSlug,
      pathSlugs,
      pathKey,
    });
    entitiesCreated.topics++;
    logger.info(`Created topic: ${topicName} (${topicSlug})`);
  }
  return topic;
};

// Parse file content
const parseFile = async (filePath: string): Promise<RawQuestion[]> => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.json' || ext === '.txt') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      throw new Error('File must contain a JSON array');
    }
    return data;
  }

  if (ext === '.docx' || ext === '.doc') {
    throw new Error('DOCX/DOC parsing is not yet implemented. Please convert to JSON format.');
  }

  throw new Error(`Unsupported file format: ${ext}`);
};

// Build unique question slug
const generateUniqueQuestionSlug = (questionText: string, questionId: number): string => {
  // Extract first 50 chars of text content (strip HTML)
  const plainText = questionText.replace(/<[^>]*>/g, '').slice(0, 50);
  const baseSlug = generateSlug(plainText) || `question-${questionId}`;
  return `${baseSlug}-${questionId}`;
};

// Main import function
export const importQuestionsFromFile = async (filePath: string): Promise<ImportResult> => {
  const result: ImportResult = {
    totalQuestions: 0,
    created: 0,
    failed: 0,
    skipped: 0,
    entitiesCreated: {
      boards: 0,
      exams: 0,
      subjects: 0,
      chapterGroups: 0,
      chapters: 0,
      topics: 0,
    },
    errors: [],
  };

  try {
    const rawQuestions = await parseFile(filePath);
    result.totalQuestions = rawQuestions.length;

    for (const rawQ of rawQuestions) {
      const metadata = rawQ.metadata || {};
      const boards = parseBoardsFromClass(metadata.class);

      if (boards.length === 0) {
        result.failed++;
        result.errors.push({
          questionId: rawQ.question_id,
          board: 'N/A',
          reason: 'No boards found in class field',
        });
        continue;
      }

      // Process for each board/exam combination
      for (const examName of boards) {
        try {
          // Find or create board
          const board = await findOrCreateBoard(examName, result.entitiesCreated);
          const boardId = board._id.toString();
          const boardSlug = board.slug;

          // Find or create exam
          const exam = await findOrCreateExam(boardId, boardSlug, examName, result.entitiesCreated);
          const examId = exam._id.toString();
          const examSlug = exam.slug;

          // Find or create subject
          const subjectName = metadata.subject || 'General';
          const subject = await findOrCreateSubject(
            boardId,
            examId,
            boardSlug,
            examSlug,
            subjectName,
            result.entitiesCreated,
          );
          const subjectId = subject._id.toString();
          const subjectSlug = subject.slug;

          // Find or create chapter group (use subject name as default chapter group)
          const chapterGroupName = `${subjectName} Chapters`;
          const chapterGroup = await findOrCreateChapterGroup(
            boardId,
            examId,
            subjectId,
            boardSlug,
            examSlug,
            subjectSlug,
            chapterGroupName,
            result.entitiesCreated,
          );
          const chapterGroupId = chapterGroup._id.toString();
          const chapterGroupSlug = chapterGroup.slug;

          // Find or create chapter
          const chapterName = metadata.chapter || 'General Chapter';
          const chapter = await findOrCreateChapter(
            boardId,
            examId,
            subjectId,
            chapterGroupId,
            boardSlug,
            examSlug,
            subjectSlug,
            chapterGroupSlug,
            chapterName,
            result.entitiesCreated,
          );
          const chapterId = chapter._id.toString();
          const chapterSlug = chapter.slug;

          // Find or create topic (optional)
          const topicName = metadata.topic || '';
          const topic = await findOrCreateTopic(
            boardId,
            examId,
            subjectId,
            chapterGroupId,
            chapterId,
            boardSlug,
            examSlug,
            subjectSlug,
            chapterGroupSlug,
            chapterSlug,
            topicName,
            result.entitiesCreated,
          );
          const topicId = topic?._id?.toString() || undefined;
          const topicSlug = topic?.slug || undefined;

          // Map question type to kind
          const kind = mapQuestionTypeToKind(metadata.question_type);
          if (!kind) {
            result.skipped++;
            result.errors.push({
              questionId: rawQ.question_id,
              board: examName,
              reason: `Unsupported question type: ${metadata.question_type}`,
            });
            continue;
          }

          // Transform options
          const { options, correctIdentifiers } = transformOptions(rawQ.options);

          // Build prompt
          const prompt = {
            en: {
              content: rawQ.question_text || '',
              images: (rawQ.question_images || []).map((url) => ({ url })),
              options,
              explanation: rawQ.solution_text || undefined,
              explanationImages: (rawQ.solution_images || []).map((url) => ({ url })),
            },
          };

          // Build correct answer
          let correct: any = null;
          if (kind === 'MCQ' || kind === 'MSQ' || kind === 'TRUE_FALSE') {
            correct = { identifiers: correctIdentifiers };
          }

          // Generate slug
          const questionSlug = generateUniqueQuestionSlug(rawQ.question_text, rawQ.question_id);

          // Build path data based on topic or chapter
          let pathKey: string;
          let pathSlugs: string[];

          if (topic) {
            pathKey = `${topic.pathKey}/${questionSlug}`;
            pathSlugs = [...topic.pathSlugs, questionSlug];
          } else {
            pathKey = `${chapter.pathKey}/${questionSlug}`;
            pathSlugs = [...chapter.pathSlugs, questionSlug];
          }

          // Check if question already exists
          const existingQuestion = await Question.findOne({ pathKey });
          if (existingQuestion) {
            result.skipped++;
            continue;
          }

          // Create question
          const questionData = {
            boardId,
            examId,
            subjectId,
            chapterGroupId,
            chapterId,
            topicId,
            boardSlug,
            examSlug,
            subjectSlug,
            chapterGroupSlug,
            chapterSlug,
            topicSlug,
            slug: questionSlug,
            pathSlugs,
            pathKey,
            kind,
            marks: 4,
            negMarks: 1,
            difficulty: mapLevelToDifficulty(metadata.level),
            calculator: false,
            prompt,
            correct,
            isActive: true,
          };

          await Question.create(questionData);
          result.created++;
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            questionId: rawQ.question_id,
            board: examName,
            reason: error?.message || String(error),
          });
          logger.error(`Error importing question ${rawQ.question_id} for board ${examName}: ${error?.message}`);
        }
      }
    }

    return result;
  } catch (error: any) {
    logger.error(`Error in importQuestionsFromFile: ${error?.message || error}`);
    throw error;
  }
};

// Export for use in controllers
export default importQuestionsFromFile;
