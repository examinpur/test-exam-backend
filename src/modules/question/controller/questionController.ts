import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import questionServices from '../services/questionServices';
import { validateQuestion, validateQuestionUpdate } from '../validation/questionValidator';
import { bulkCreateQuestions } from '../helper/bulkSaveQuestions';
import { parseQuestionFile, cleanupFile } from '../helper/parseQuestionFile';
import { importQuestionsFromFile } from '../helper/importQuestionsFromFile';

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
  let filePath: string | undefined;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'No file uploaded. Please upload a JSON or DOCX file.',
      });
    }

    filePath = file.path;
    const data = await parseQuestionFile(filePath);

    if (!data || !Array.isArray(data) || data.length === 0) {
      cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'File must contain a non-empty array',
      });
    }

    const result = await bulkCreateQuestions(data);

    cleanupFile(filePath);

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
      message: `Bulk create completed. Created: ${result.created}, Failed: ${result.failed}`,
      data: result,
    });
  } catch (error: any) {
    if (filePath) cleanupFile(filePath);

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

const questionController = {
  createQuestion,
  updateQuestion,
  getQuestions,
  getQuestion,
  deleteQuestion,
  bulkCreateQuestion,
  importQuestionsFromDataset,
};

export default questionController;

