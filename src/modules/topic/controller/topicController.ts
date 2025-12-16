import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import topicServices from '../services/topicServices';
import { validateTopic, validateTopicUpdate } from '../validation/topicValidator';

const createTopic = async (req: Request, res: Response) => {
  try {
    const { boardId, examId, subjectId, chapterGroupId, chapterId, name } = req.body;

    const validation = validateTopic({ boardId, examId, subjectId, chapterGroupId, chapterId, name });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await topicServices.createTopic(boardId, examId, subjectId, chapterGroupId, chapterId, name);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in createTopic controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const updateTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { boardId, examId, subjectId, chapterGroupId, chapterId, name } = req.body;

    if (!boardId && !examId && !subjectId && !chapterGroupId && !chapterId && !name) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'At least one field (boardId, examId, subjectId, chapterGroupId, chapterId, or name) is required for update',
      });
    }

    const validation = validateTopicUpdate({ boardId, examId, subjectId, chapterGroupId, chapterId, name });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await topicServices.updateTopic(id, boardId, examId, subjectId, chapterGroupId, chapterId, name);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in updateTopic controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getTopics = async (req: Request, res: Response) => {
  try {
    const { chapterId, slug } = req.query;

    let result;
    if (slug) {
      result = await topicServices.getTopicBySlug(slug as string);
    } else if (chapterId) {
      result = await topicServices.getTopicsByChapterId(chapterId as string);
    } else {
      result = await topicServices.getAllTopics();
    }

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getTopics controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await topicServices.getTopicById(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getTopic controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await topicServices.deleteTopic(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in deleteTopic controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const topicController = {
  createTopic,
  updateTopic,
  getTopics,
  getTopic,
  deleteTopic,
};

export default topicController;
