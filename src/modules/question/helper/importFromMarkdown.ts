import fs from 'fs';
import path from 'path';
import questionServices from '../services/questionServices';
import chapterModel from '../../../models/chapterModel';
import topicModel from '../../../models/topicModel';
import paperModel from '../../../models/paperModel';
import logger from '../../../utils/logger';

/**
 * Parsed question from markdown file
 */
interface ParsedQuestion {
  questionNumber: number;
  content: string;
  images: string[];
  options: Array<{
    identifier: string;
    content: string;
    images: string[];
  }>;
}

/**
 * Template metadata from JSON file
 */
interface QuestionTemplate {
  country?: string;
  examGroup?: string;
  exam?: string;
  marks?: number;
  negMarks?: number;
  subject?: string;
  chapterGroup?: string;
  chapter: string;
  topic?: string;
  year?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  type?: string;
  paperId?: string;
  yearKey?: string;
  section?: string[];
  languages?: string[];
}

/**
 * Import result
 */
interface ImportResult {
  total: number;
  created: number;
  failed: number;
  errors: Array<{
    questionNumber: number;
    reason: string;
  }>;
}

/**
 * Extract markdown images from text
 * Format: ![alt](url)
 */
const extractImages = (text: string): { cleanText: string; images: string[] } => {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: string[] = [];
  let match;

  while ((match = imageRegex.exec(text)) !== null) {
    images.push(match[2]); // URL is in the second capture group
  }

  // Remove images from text
  const cleanText = text.replace(imageRegex, '').trim();

  return { cleanText, images };
};

/**
 * Parse option identifier from text
 * Supports: (a), (b), (1), (2), A., B., etc.
 */
const parseOptionIdentifier = (text: string): { identifier: string; content: string } | null => {
  // Match patterns like (a), (b), (1), (2), (A), etc.
  const parenMatch = text.match(/^\s*\(([a-dA-D1-4])\)\s*(.*)$/s);
  if (parenMatch) {
    return {
      identifier: parenMatch[1].toUpperCase(),
      content: parenMatch[2].trim(),
    };
  }

  // Match patterns like a), b), 1), 2)
  const singleParenMatch = text.match(/^\s*([a-dA-D1-4])\)\s*(.*)$/s);
  if (singleParenMatch) {
    return {
      identifier: singleParenMatch[1].toUpperCase(),
      content: singleParenMatch[2].trim(),
    };
  }

  // Match patterns like A., B., 1., 2.
  const dotMatch = text.match(/^\s*([a-dA-D1-4])\.\s*(.*)$/s);
  if (dotMatch) {
    return {
      identifier: dotMatch[1].toUpperCase(),
      content: dotMatch[2].trim(),
    };
  }

  return null;
};

/**
 * Convert numeric option identifiers to letters
 */
const normalizeIdentifier = (id: string): string => {
  const map: Record<string, string> = {
    '1': 'A',
    '2': 'B',
    '3': 'C',
    '4': 'D',
  };
  return map[id] || id.toUpperCase();
};

/**
 * Parse markdown file to extract questions
 */
export const parseMarkdownQuestions = (markdownContent: string): ParsedQuestion[] => {
  const questions: ParsedQuestion[] = [];
  const lines = markdownContent.split('\n');

  let currentQuestion: ParsedQuestion | null = null;
  let currentContent: string[] = [];
  let currentOptionLines: string[] = [];
  let inOptions = false;

  const finalizeQuestion = () => {
    if (currentQuestion) {
      // Process accumulated content
      const fullContent = currentContent.join('\n').trim();
      const { cleanText, images } = extractImages(fullContent);
      currentQuestion.content = cleanText;
      currentQuestion.images = images;

      // Process options
      if (currentOptionLines.length > 0) {
        const optionsText = currentOptionLines.join('\n');
        // Split by option patterns
        const optionParts = optionsText.split(/(?=\([a-dA-D1-4]\)|\b[a-dA-D1-4]\)|\b[a-dA-D1-4]\.)/);

        for (const part of optionParts) {
          const trimmedPart = part.trim();
          if (!trimmedPart) continue;

          const parsed = parseOptionIdentifier(trimmedPart);
          if (parsed) {
            const { cleanText: optContent, images: optImages } = extractImages(parsed.content);
            currentQuestion.options.push({
              identifier: normalizeIdentifier(parsed.identifier),
              content: optContent,
              images: optImages,
            });
          }
        }
      }

      questions.push(currentQuestion);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for new question (starts with number followed by period or dot)
    const questionMatch = line.match(/^(\d+)\.\s*(.*)$/);

    if (questionMatch) {
      // Finalize previous question
      finalizeQuestion();

      // Start new question
      currentQuestion = {
        questionNumber: parseInt(questionMatch[1], 10),
        content: '',
        images: [],
        options: [],
      };
      currentContent = [questionMatch[2]];
      currentOptionLines = [];
      inOptions = false;
      continue;
    }

    if (!currentQuestion) continue;

    // Check if line starts an option
    const optionCheck = parseOptionIdentifier(line.trim());

    if (optionCheck) {
      inOptions = true;
      currentOptionLines.push(line);
    } else if (inOptions) {
      // Continue collecting option content
      currentOptionLines.push(line);
    } else {
      // Continue collecting question content
      currentContent.push(line);
    }
  }

  // Finalize last question
  finalizeQuestion();

  return questions;
};

/**
 * Map question type to kind
 */
const mapTypeToKind = (type: string): string => {
  const typeMap: Record<string, string> = {
    mcq: 'MCQ',
    msq: 'MSQ',
    integer: 'INTEGER',
    fill_blank: 'FILL_BLANK',
    true_false: 'TRUE_FALSE',
  };
  return typeMap[type?.toLowerCase()] || 'MCQ';
};

/**
 * Build reference maps for chapters, topics, and papers
 */
const buildReferenceMaps = async (template: QuestionTemplate) => {
  const [chapters, topics, papers] = await Promise.all([
    template.chapter
      ? chapterModel.find({ slug: template.chapter, isActive: true }).lean()
      : Promise.resolve([]),
    template.topic
      ? topicModel.find({ slug: template.topic, isActive: true }).lean()
      : Promise.resolve([]),
    template.paperId
      ? paperModel.find({ slug: template.paperId, isActive: true }).lean()
      : Promise.resolve([]),
  ]);

  return {
    chapter: chapters[0] || null,
    topic: topics[0] || null,
    paper: papers[0] || null,
  };
};

/**
 * Import questions from markdown file using template metadata
 * @param markdownPath - Path to the markdown file
 * @param template - Template object containing metadata
 * @param correctAnswers - Optional map of question number to correct option(s)
 */
export const importQuestionsFromMarkdown = async (
  markdownPath: string,
  template: QuestionTemplate,
  correctAnswers?: Record<number, string[]>,
): Promise<ImportResult> => {
  const result: ImportResult = {
    total: 0,
    created: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Read and parse markdown file
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
    const parsedQuestions = parseMarkdownQuestions(markdownContent);
    result.total = parsedQuestions.length;

    if (parsedQuestions.length === 0) {
      result.errors.push({
        questionNumber: 0,
        reason: 'No questions found in markdown file',
      });
      return result;
    }

    // Build reference maps
    const refs = await buildReferenceMaps(template);

    if (!refs.chapter) {
      result.errors.push({
        questionNumber: 0,
        reason: `Chapter not found: ${template.chapter}`,
      });
      return result;
    }

    const chapter = refs.chapter as any;
    const topic = refs.topic as any;
    const paper = refs.paper as any;

    // Process each question
    for (const parsed of parsedQuestions) {
      try {
        const kind = mapTypeToKind(template.type || 'mcq');

        // Build options
        const options = parsed.options.map((opt) => ({
          identifier: opt.identifier,
          content: opt.content,
          // For images, we store URL references - in production you'd upload to Cloudinary
          images: opt.images.map((url) => ({ url })),
        }));

        // Get correct answers if provided
        const correctIdentifiers = correctAnswers?.[parsed.questionNumber] || [];

        // Build prompt
        const prompt = {
          en: {
            content: parsed.content,
            images: parsed.images.map((url) => ({ url })),
            options,
            explanation: undefined,
            explanationImages: [],
          },
        };

        // Build correct answer object
        let correct: any = null;
        if (kind === 'MCQ' || kind === 'MSQ' || kind === 'TRUE_FALSE') {
          correct = { identifiers: correctIdentifiers };
        }

        // Generate question name from content
        const name = parsed.content.slice(0, 80) || `Question ${parsed.questionNumber}`;

        const payload = {
          boardId: chapter.boardId,
          examId: chapter.examId,
          subjectId: chapter.subjectId,
          chapterGroupId: chapter.chapterGroupId,
          chapterId: chapter._id,
          topicId: topic?._id || undefined,
          paperRefId: paper?._id || undefined,
          paperId: paper?.slug || template.paperId || undefined,
          kind,
          name,
          marks: template.marks || 4,
          negMarks: template.negMarks || 1,
          difficulty: template.difficulty || 'easy',
          calculator: false,
          prompt,
          correct,
          year: template.year,
          yearKey: template.yearKey,
          section: template.section || [],
          tags: template.topic ? [template.topic] : [],
        };

        const response = await questionServices.createQuestion(payload);

        if (response.success) {
          result.created++;
        } else {
          result.failed++;
          result.errors.push({
            questionNumber: parsed.questionNumber,
            reason: response.message || 'Unknown error',
          });
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          questionNumber: parsed.questionNumber,
          reason: error?.message || String(error),
        });
        logger.error(`Error importing question ${parsed.questionNumber}: ${error?.message}`);
      }
    }

    return result;
  } catch (error: any) {
    logger.error(`Error in importQuestionsFromMarkdown: ${error?.message || error}`);
    throw error;
  }
};

/**
 * Import questions using both markdown and JSON template files
 * @param markdownPath - Path to markdown file
 * @param jsonPath - Path to JSON template file
 */
export const importFromMarkdownAndJson = async (
  markdownPath: string,
  jsonPath: string,
): Promise<ImportResult> => {
  try {
    // Read JSON template
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const jsonData = JSON.parse(jsonContent);

    // Extract template from first question in JSON if it's an array
    let template: QuestionTemplate;
    let correctAnswers: Record<number, string[]> = {};

    if (Array.isArray(jsonData)) {
      // If JSON contains array of subjects with questions
      const firstSubject = jsonData[0];
      if (firstSubject?.questions?.[0]) {
        const sampleQuestion = firstSubject.questions[0];
        template = {
          chapter: sampleQuestion.chapter,
          topic: sampleQuestion.topic,
          marks: sampleQuestion.marks,
          negMarks: sampleQuestion.negMarks,
          difficulty: sampleQuestion.difficulty,
          type: sampleQuestion.type,
          paperId: sampleQuestion.paperId,
          year: sampleQuestion.year,
          yearKey: sampleQuestion.yearKey,
          section: sampleQuestion.section,
        };

        // Build correct answers map from JSON
        firstSubject.questions.forEach((q: any, index: number) => {
          if (q.question?.en?.correct_options) {
            correctAnswers[index + 1] = q.question.en.correct_options;
          }
        });
      } else {
        throw new Error('Invalid JSON structure: expected array with subjects containing questions');
      }
    } else if (jsonData.chapter) {
      // Direct template object
      template = jsonData as QuestionTemplate;
    } else {
      throw new Error('Invalid JSON structure: expected template object or array of subjects');
    }

    return await importQuestionsFromMarkdown(markdownPath, template, correctAnswers);
  } catch (error: any) {
    logger.error(`Error in importFromMarkdownAndJson: ${error?.message || error}`);
    throw error;
  }
};

export default {
  parseMarkdownQuestions,
  importQuestionsFromMarkdown,
  importFromMarkdownAndJson,
};

