import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import paperServices from '../services/paperServices';
import { validatePaper, validatePaperUpdate } from '../validation/paperValidator';

const createPaper = async (req: Request, res: Response) => {
  try {
    const { boardId, examId, name, year, paperNumber, shift } = req.body;

    const validation = validatePaper({ boardId, examId, name, year, paperNumber, shift });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await paperServices.createPaper(boardId, examId, name, year, paperNumber, shift);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in createPaper controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const updatePaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { boardId, examId, name, year, paperNumber, shift, questionPathKeys, questionCount } = req.body;

    const validation = validatePaperUpdate({ boardId, examId, name, year, paperNumber, shift, questionPathKeys, questionCount });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await paperServices.updatePaper(id, boardId, examId, name, year, paperNumber, shift, questionPathKeys, questionCount);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in updatePaper controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getPapers = async (req: Request, res: Response) => {
  try {
    const { examId, slug } = req.query;

    let result;
    if (slug) {
      result = await paperServices.getPaperBySlug(slug as string);
    } else if (examId) {
      result = await paperServices.getPapersByExamId(examId as string);
    } else {
      result = await paperServices.getAllPapers();
    }

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getPapers controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await paperServices.getPaperById(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getPaper controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const deletePaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await paperServices.deletePaper(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in deletePaper controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const paperController = {
  createPaper,
  updatePaper,
  getPapers,
  getPaper,
  deletePaper,
};

export default paperController;

