import Question from '../../../models/questionModel';
import Chapter from '../../../models/chapterModel';
import Topic from '../../../models/topicModel';
import { generateSlug } from '../../../utils/slug';
import { QuestionResponse } from '../types/questionTypes';
import { generateImageUrl, CloudinaryImage } from '../helper/cloudinaryHelper';

// Image transformation helpers
const transformImage = (image: any): any => {
  if (!image || !image.publicId || !image.version) return image;
  return {
    ...image,
    url: generateImageUrl(image as CloudinaryImage),
  };
};

const transformImages = (images: any[]): any[] => {
  if (!images || !Array.isArray(images)) return [];
  return images.map(transformImage);
};

const transformOptions = (options: any[]): any[] => {
  if (!options || !Array.isArray(options)) return [];
  return options.map((opt) => ({
    ...opt,
    images: transformImages(opt.images || []),
  }));
};

const transformLocalizedBlock = (block: any): any => {
  if (!block) return block;
  return {
    ...block,
    images: transformImages(block.images || []),
    options: transformOptions(block.options || []),
    explanationImages: transformImages(block.explanationImages || []),
  };
};

const transformI18n = (i18n: any): any => {
  if (!i18n) return i18n;
  return {
    ...(i18n.en ? { en: transformLocalizedBlock(i18n.en) } : {}),
    ...(i18n.hi ? { hi: transformLocalizedBlock(i18n.hi) } : {}),
  };
};

/**
 * Transform question data to include image URLs for response
 */
const transformQuestionForResponse = (question: any): any => {
  if (!question) return question;

  const doc = question.toObject ? question.toObject() : question;

  return {
    ...doc,
    prompt: transformI18n(doc.prompt),
    passage: transformI18n(doc.passage),
  };
};

/**
 * Transform array of questions for response
 */
const transformQuestionsForResponse = (questions: any[]): any[] => {
  return questions.map(transformQuestionForResponse);
};

const validateQuestionKind = (kind: string, prompt: any, passage: any, correct: any, topicId?: string): { valid: boolean; message?: string } => {
  if (kind === 'COMPREHENSION_PASSAGE') {
    if (!passage || !passage.en || !passage.en.content) {
      return { valid: false, message: 'Comprehension passage must have passage.en.content' };
    }
    if (correct) {
      return { valid: false, message: 'Comprehension passage should not have correct answer' };
    }
    return { valid: true };
  }

  if (!prompt || !prompt.en || !prompt.en.content) {
    return { valid: false, message: 'Question must have prompt.en.content' };
  }

  if (kind === 'MCQ' || kind === 'MSQ') {
    if (!prompt.en.options || prompt.en.options.length < 2) {
      return { valid: false, message: `${kind} must have at least 2 options` };
    }
    if (!correct || !correct.identifiers || correct.identifiers.length === 0) {
      return { valid: false, message: `${kind} must have correct.identifiers` };
    }
    if (kind === 'MCQ' && correct.identifiers.length !== 1) {
      return { valid: false, message: 'MCQ must have exactly one correct identifier' };
    }
  }

  if (kind === 'TRUE_FALSE') {
    if (!prompt.en.options || prompt.en.options.length !== 2) {
      return { valid: false, message: 'TRUE_FALSE must have exactly 2 options (T and F)' };
    }
    const identifiers = prompt.en.options.map((opt: any) => opt.identifier).sort();
    if (identifiers[0] !== 'F' || identifiers[1] !== 'T') {
      return { valid: false, message: 'TRUE_FALSE options must be exactly T and F' };
    }
    if (!correct || !correct.identifiers || correct.identifiers.length !== 1) {
      return { valid: false, message: 'TRUE_FALSE must have exactly one correct identifier (T or F)' };
    }
  }

  if (kind === 'INTEGER') {
    if (prompt.en.options && prompt.en.options.length > 0) {
      return { valid: false, message: 'INTEGER questions should not have options' };
    }
    if (!correct || correct.integer === undefined || correct.integer === null) {
      return { valid: false, message: 'INTEGER question must have correct.integer' };
    }
  }

  if (kind === 'FILL_BLANK') {
    if (!correct || !correct.fills || correct.fills.length === 0) {
      return { valid: false, message: 'FILL_BLANK must have correct.fills array' };
    }
  }

  return { valid: true };
};

const computePathKey = async (
  comprehensionId: string | undefined,
  topicId: string | undefined,
  chapterId: string,
  slug: string,
): Promise<{ pathKey: string; pathSlugs: string[]; slugs: any }> => {
  if (comprehensionId) {
    const parentQuestion = await Question.findById(comprehensionId);
    if (!parentQuestion) {
      throw new Error('Comprehension passage not found');
    }
    return {
      pathKey: `${parentQuestion.pathKey}/${slug}`,
      pathSlugs: [...parentQuestion.pathSlugs, slug],
      slugs: {
        boardSlug: parentQuestion.boardSlug,
        examSlug: parentQuestion.examSlug,
        subjectSlug: parentQuestion.subjectSlug,
        chapterGroupSlug: parentQuestion.chapterGroupSlug,
        chapterSlug: parentQuestion.chapterSlug,
        topicSlug: parentQuestion.topicSlug,
      },
    };
  }

  if (topicId) {
    const topic = await Topic.findById(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }
    return {
      pathKey: `${topic.pathKey}/${slug}`,
      pathSlugs: [...topic.pathSlugs, slug],
      slugs: {
        boardSlug: topic.boardSlug,
        examSlug: topic.examSlug,
        subjectSlug: topic.subjectSlug,
        chapterGroupSlug: topic.chapterGroupSlug,
        chapterSlug: topic.chapterSlug,
        topicSlug: topic.slug,
      },
    };
  }

  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
    throw new Error('Chapter not found');
  }
  return {
    pathKey: `${chapter.pathKey}/${slug}`,
    pathSlugs: [...chapter.pathSlugs, slug],
    slugs: {
      boardSlug: chapter.boardSlug,
      examSlug: chapter.examSlug,
      subjectSlug: chapter.subjectSlug,
      chapterGroupSlug: chapter.chapterGroupSlug,
      chapterSlug: chapter.slug,
      topicSlug: undefined,
    },
  };
};

const createQuestion = async (data: any): Promise<QuestionResponse> => {
  try {
    const {
      boardId,
      examId,
      subjectId,
      chapterGroupId,
      chapterId,
      topicId,
      paperRefId,
      comprehensionId,
      comprehensionOrder,
      kind,
      name,
      marks,
      negMarks,
      difficulty,
      calculator,
      passage,
      prompt,
      correct,
      year,
      paperId,
      yearKey,
      section,
      tags,
      slug: incomingSlug,
      pathKey: incomingPathKey,
      pathSlugs: incomingPathSlugs,
      boardSlug: incomingBoardSlug,
      examSlug: incomingExamSlug,
      subjectSlug: incomingSubjectSlug,
      chapterGroupSlug: incomingChapterGroupSlug,
      chapterSlug: incomingChapterSlug,
      topicSlug: incomingTopicSlug,
    } = data;

    const validation = validateQuestionKind(kind, prompt, passage, correct, topicId);
    if (!validation.valid) {
      return { success: false, statusCode: 400, message: validation.message || 'Invalid question kind' };
    }

    const slug = generateSlug(incomingSlug || name);

    const hasIncomingPath =
      incomingPathKey &&
      Array.isArray(incomingPathSlugs) &&
      incomingBoardSlug &&
      incomingExamSlug &&
      incomingSubjectSlug &&
      incomingChapterGroupSlug &&
      incomingChapterSlug;

    const pathData = hasIncomingPath
      ? {
          pathKey: String(incomingPathKey),
          pathSlugs: incomingPathSlugs,
          slugs: {
            boardSlug: incomingBoardSlug,
            examSlug: incomingExamSlug,
            subjectSlug: incomingSubjectSlug,
            chapterGroupSlug: incomingChapterGroupSlug,
            chapterSlug: incomingChapterSlug,
            topicSlug: incomingTopicSlug,
          },
        }
      : await computePathKey(
          comprehensionId?.toString(),
          topicId?.toString(),
          chapterId?.toString(),
          slug,
        );

    let query: any = {};
    if (comprehensionId) query = { comprehensionId, slug };
    else if (topicId) query = { topicId, slug, comprehensionId: { $exists: false } };
    else query = { chapterId, slug, comprehensionId: { $exists: false }, topicId: { $exists: false } };

    const existingQuestion = await Question.findOne(query);
    if (existingQuestion) {
      return { success: false, statusCode: 400, message: 'Question with this slug already exists' };
    }

    const question = await Question.create({
      boardId,
      examId,
      subjectId,
      chapterGroupId,
      chapterId,
      topicId,

      boardSlug: pathData.slugs.boardSlug,
      examSlug: pathData.slugs.examSlug,
      subjectSlug: pathData.slugs.subjectSlug,
      chapterGroupSlug: pathData.slugs.chapterGroupSlug,
      chapterSlug: pathData.slugs.chapterSlug,
      topicSlug: pathData.slugs.topicSlug,

      paperRefId,
      comprehensionId,
      comprehensionOrder: comprehensionOrder || 0,
      slug,
      pathSlugs: pathData.pathSlugs,
      pathKey: pathData.pathKey,
      kind,
      marks: marks || 4,
      negMarks: negMarks || 1,
      difficulty: difficulty || 'easy',
      calculator: calculator || false,
      passage,
      prompt,
      correct,
      year,
      paperId,
      yearKey,
      section: section || [],
      tags: tags || [],
      isActive: true,
    });

    return { success: true, statusCode: 201, message: 'Question created successfully', data: transformQuestionForResponse(question) };
  } catch (error: any) {
    return { success: false, statusCode: 500, message: 'Error occurred while creating question', error: error?.message || error };
  }
};


const updateQuestion = async (id: string, data: any): Promise<QuestionResponse> => {
  try {
    const question = await Question.findById(id);
    if (!question) {
      return {
        success: false,
        statusCode: 404,
        message: 'Question not found',
      };
    }

    const updateData: any = { ...data };
    let needsPathRecalc = false;

    if (data.name && data.name !== question.slug) {
      const slug = generateSlug(data.name);
      updateData.slug = slug;
      needsPathRecalc = true;
    }

    if (data.comprehensionId || data.topicId || data.chapterId) {
      needsPathRecalc = true;
    }

    if (needsPathRecalc) {
      const comprehensionId = updateData.comprehensionId || question.comprehensionId?.toString();
      const topicId = updateData.topicId || question.topicId?.toString();
      const chapterId = updateData.chapterId || question.chapterId.toString();
      const slug = updateData.slug || question.slug;

      const pathData = await computePathKey(comprehensionId, topicId, chapterId, slug);
      updateData.pathKey = pathData.pathKey;
      updateData.pathSlugs = pathData.pathSlugs;
      updateData.boardSlug = pathData.slugs.boardSlug;
      updateData.examSlug = pathData.slugs.examSlug;
      updateData.subjectSlug = pathData.slugs.subjectSlug;
      updateData.chapterGroupSlug = pathData.slugs.chapterGroupSlug;
      updateData.chapterSlug = pathData.slugs.chapterSlug;
      updateData.topicSlug = pathData.slugs.topicSlug;
    }

    if (updateData.kind || updateData.prompt || updateData.passage || updateData.correct) {
      const kind = updateData.kind || question.kind;
      const prompt = updateData.prompt || question.prompt;
      const passage = updateData.passage || question.passage;
      const correct = updateData.correct || question.correct;
      const topicId = updateData.topicId || question.topicId?.toString();

      const validation = validateQuestionKind(kind, prompt, passage, correct, topicId);
      if (!validation.valid) {
        return {
          success: false,
          statusCode: 400,
          message: validation.message || 'Invalid question kind',
        };
      }
    }

    const updatedQuestion = await Question.findByIdAndUpdate(id, updateData, { new: true });

    return {
      success: true,
      statusCode: 200,
      message: 'Question updated successfully',
      data: transformQuestionForResponse(updatedQuestion),
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while updating question',
      error: error?.message || error,
    };
  }
};

const getAllQuestions = async (): Promise<QuestionResponse> => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Questions fetched successfully',
      data: transformQuestionsForResponse(questions),
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching questions',
      error: error?.message || error,
    };
  }
};

const getQuestionById = async (id: string): Promise<QuestionResponse> => {
  try {
    const question = await Question.findById(id);

    if (!question) {
      return {
        success: false,
        statusCode: 404,
        message: 'Question not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Question fetched successfully',
      data: transformQuestionForResponse(question),
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching question',
      error: error?.message || error,
    };
  }
};

const getQuestionByPathKey = async (pathKey: string): Promise<QuestionResponse> => {
  try {
    const question = await Question.findOne({ pathKey, isActive: true });

    if (!question) {
      return {
        success: false,
        statusCode: 404,
        message: 'Question not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Question fetched successfully',
      data: transformQuestionForResponse(question),
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching question',
      error: error?.message || error,
    };
  }
};

const getQuestionsByChapterId = async (chapterId: string): Promise<QuestionResponse> => {
  try {
    const questions = await Question.find({
      chapterId,
      comprehensionId: { $exists: false },
      isActive: true,
    }).sort({ comprehensionOrder: 1, createdAt: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Questions fetched successfully',
      data: transformQuestionsForResponse(questions),
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching questions',
      error: error?.message || error,
    };
  }
};

const getQuestionsByTopicId = async (topicId: string): Promise<QuestionResponse> => {
  try {
    const questions = await Question.find({
      topicId,
      comprehensionId: { $exists: false },
      isActive: true,
    }).sort({ comprehensionOrder: 1, createdAt: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Questions fetched successfully',
      data: transformQuestionsForResponse(questions),
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching questions',
      error: error?.message || error,
    };
  }
};

const getQuestionsByComprehensionId = async (comprehensionId: string): Promise<QuestionResponse> => {
  try {
    const questions = await Question.find({
      comprehensionId,
      isActive: true,
    }).sort({ comprehensionOrder: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Questions fetched successfully',
      data: transformQuestionsForResponse(questions),
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching questions',
      error: error?.message || error,
    };
  }
};

const getQuestionsByPaperId = async (paperId: string): Promise<QuestionResponse> => {
  try {
    const questions = await Question.find({
      paperId,
      isActive: true,
    }).sort({ createdAt: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Questions fetched successfully',
      data: transformQuestionsForResponse(questions),
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching questions',
      error: error?.message || error,
    };
  }
};

const deleteQuestion = async (id: string): Promise<QuestionResponse> => {
  try {
    const question = await Question.findByIdAndDelete(id);

    if (!question) {
      return {
        success: false,
        statusCode: 404,
        message: 'Question not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Question deleted successfully',
      data: transformQuestionForResponse(question),
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while deleting question',
      error: error?.message || error,
    };
  }
};

const questionServices = {
  createQuestion,
  updateQuestion,
  getAllQuestions,
  getQuestionById,
  getQuestionByPathKey,
  getQuestionsByChapterId,
  getQuestionsByTopicId,
  getQuestionsByComprehensionId,
  getQuestionsByPaperId,
  deleteQuestion,
};

export default questionServices;
