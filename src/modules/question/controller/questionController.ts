import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import questionServices from '../services/questionServices';
import { validateQuestion, validateQuestionUpdate } from '../validation/questionValidator';

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

const questionController = {
  createQuestion,
  updateQuestion,
  getQuestions,
  getQuestion,
  deleteQuestion,
};

export default questionController;

