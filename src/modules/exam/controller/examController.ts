import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import examServices from '../services/examServices';
import { validateExam, validateExamUpdate } from '../validation/examValidator';
import { normalizeI18nName } from '../../board/helper/board';

const createExam = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.body;
    const name = normalizeI18nName(req.body.name);

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

    const boardId = req.body.boardId;
    const name = normalizeI18nName(req.body.name);

    const order =
      req.body.order !== undefined ? Number(req.body.order) : undefined;

    const isActive =
      req.body.isActive !== undefined
        ? req.body.isActive === "true" || req.body.isActive === true
        : undefined;

    const validation = validateExamUpdate({ boardId, name, order, isActive });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${validation.error.issues?.[0]?.message}`,
        error: validation.error.issues,
      });
    }

    const result = await examServices.updateExam(
      id,
      { boardId, name, order, isActive },
      req.file
    );

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred in updateExam controller: ${
        error?.message || error
      }`
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error",
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

const getExamByBoardId = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params;
    console.log(boardId);
    const result = await examServices.getExamsByBoardId(boardId as string);

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

const getExamBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params ?? req.body;

    const result = await examServices.getExamBySlug(slug as string);

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


const examController = {
  createExam,
  updateExam,
  getExams,
  getExam,
  deleteExam,
  getExamByBoardId,
  getExamBySlug
};

export default examController;

