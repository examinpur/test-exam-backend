import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import boardServices from '../services/boardServices';
import { validateBoard } from '../validation/boardValidator';
import { normalizeI18nName } from '../helper/board';

const createBoard = async (req: Request, res: Response) => {
  try {
    const name = normalizeI18nName(req.body.name);

    const validation = validateBoard({ name });
    if (!validation.success) {
      const issues = validation.error.issues;
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${issues?.[0]?.path?.join(".")} - ${issues?.[0]?.message}`,
        error: issues,
      });
    }
    const result = await boardServices.createBoard(name, req.file);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred in createBoard controller: ${
        error?.message || error?.response?.error?.message || error?.response?.error || error
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

const updateBoard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {  order , isActive } = req.body;
    const name = normalizeI18nName(req.body.name);
    const validation = validateBoard({ name });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }
    const updates = {name , order , isActive , image: req.file ? req.file : null};
    const result = await boardServices.updateBoard(id, updates);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in updateBoard controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getBoards = async (req: Request, res: Response) => {
  try {
    const { slug } = req.query;

    let result;
    if (slug) {
      result = await boardServices.getBoardBySlug(slug as string);
    } else {
      result = await boardServices.getAllBoards();
    }

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getBoards controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getBoard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await boardServices.getBoardById(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getBoard controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const deleteBoard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await boardServices.deleteBoard(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in deleteBoard controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const boardController = {
  createBoard,
  updateBoard,
  getBoards,
  getBoard,
  deleteBoard,
};

export default boardController;

