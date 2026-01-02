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
   const result = await bulkCreateQuestions(data, zipBuffer);

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

    let chapter, topic, marks, negMarks, difficulty, type, paperId, year, yearKey, section, correctAnswers;

    if (req.body.data) {
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

    const parsedCorrectAnswers = correctAnswers
      ? (typeof correctAnswers === 'string' ? JSON.parse(correctAnswers) : correctAnswers)
      : undefined;

    const result = await importQuestionsFromMarkdown(filePath, template, parsedCorrectAnswers);

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


