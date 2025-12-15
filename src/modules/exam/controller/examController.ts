import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import examServices from '../services/examServices';
import { validateExam, validateExamUpdate } from '../validation/examValidator';

const createExam = async (req: Request, res: Response) => {
  try {
    const { boardId, name } = req.body;

    const validation = validateExam({ boardId, name });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await examServices.createExam(boardId, name);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in createExam controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const updateExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { boardId, name } = req.body;

    // At least one field should be provided
    if (!boardId && !name) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'At least one field (boardId or name) is required for update',
      });
    }

    const validation = validateExamUpdate({ boardId, name });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await examServices.updateExam(id, boardId, name);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in updateExam controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getExams = async (req: Request, res: Response) => {
  try {
    const { boardId, slug } = req.query;

    let result;
    if (slug) {
      result = await examServices.getExamBySlug(slug as string);
    } else if (boardId) {
      result = await examServices.getExamsByBoardId(boardId as string);
    } else {
      result = await examServices.getAllExams();
    }

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getExams controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await examServices.getExamById(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getExam controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const deleteExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await examServices.deleteExam(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in deleteExam controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const examController = {
  createExam,
  updateExam,
  getExams,
  getExam,
  deleteExam,
};

export default examController;

