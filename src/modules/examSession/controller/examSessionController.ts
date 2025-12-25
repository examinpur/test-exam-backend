import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import examSessionServices from '../services/examSessionServices';
import {
  validateCreateExamTest,
  validateCreateExamSession,
  validateUpdateExamSession,
} from '../validation/examSessionValidator';

const createExamTest = async (req: Request, res: Response) => {
  try {
    const validation = validateCreateExamTest(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await examSessionServices.createExamTest(req.body);
    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in createExamTest controller: ${error?.message || error}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getExamTest = async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const result = await examSessionServices.getExamTest(testId);
    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getExamTest controller: ${error?.message || error}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const createExamSession = async (req: Request, res: Response) => {
  try {
    const validation = validateCreateExamSession(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await examSessionServices.createExamSession(req.body);
    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in createExamSession controller: ${error?.message || error}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getExamSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;
    const result = await examSessionServices.getExamSession(sessionId, userId as string);
    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getExamSession controller: ${error?.message || error}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getUserExamSessions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    const result = await examSessionServices.getUserExamSessions(userId, status as string);
    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getUserExamSessions controller: ${error?.message || error}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const updateExamSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'User ID is required',
      });
    }

    const validation = validateUpdateExamSession(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const { userId: _, ...updates } = req.body;
    const result = await examSessionServices.updateExamSession(sessionId, userId, updates);
    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in updateExamSession controller: ${error?.message || error}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const submitExamSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'User ID is required',
      });
    }

    const result = await examSessionServices.submitExamSession(sessionId, userId);
    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in submitExamSession controller: ${error?.message || error}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const examSessionController = {
  createExamTest,
  getExamTest,
  createExamSession,
  getExamSession,
  getUserExamSessions,
  updateExamSession,
  submitExamSession,
};

export default examSessionController;


