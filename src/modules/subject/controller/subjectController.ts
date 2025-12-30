import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import subjectServices from '../services/subjectServices';
import { validateSubject, validateSubjectUpdate } from '../validation/subjectValidator';
import { normalizeI18nName } from '../../board/helper/board';

const createSubject = async (req: Request, res: Response) => {
  try {
    const { boardId, examId } = req.body;
    const name = normalizeI18nName(req.body.name);

    const validation = validateSubject({ boardId, examId, name });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await subjectServices.createSubject(boardId, examId, name);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in createSubject controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { boardId, examId } = req.body;

    const name = normalizeI18nName(req.body.name);

    const order =
      req.body.order !== undefined ? Number(req.body.order) : undefined;

    const isActive =
      req.body.isActive !== undefined
        ? req.body.isActive === "true" || req.body.isActive === true
        : undefined;

    const validation = validateSubjectUpdate({ boardId, examId, name, order, isActive });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await subjectServices.updateSubject(
       id,
      { boardId, examId, name, order, isActive });

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in updateSubject controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getSubjects = async (req: Request, res: Response) => {
  try {
    const { examId, slug } = req.query;

    let result;
    if (slug) {
      result = await subjectServices.getSubjectBySlug(slug as string);
    } else if (examId) {
      result = await subjectServices.getSubjectsByExamId(examId as string);
    } else {
      result = await subjectServices.getAllSubjects();
    }

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getSubjects controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await subjectServices.getSubjectById(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getSubject controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await subjectServices.deleteSubject(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in deleteSubject controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const subjectController = {
  createSubject,
  updateSubject,
  getSubjects,
  getSubject,
  deleteSubject,
};

export default subjectController;
