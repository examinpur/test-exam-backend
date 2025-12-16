import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import chapterGroupServices from '../services/chapterGroupServices';
import { validateChapterGroup, validateChapterGroupUpdate } from '../validation/chapterGroupValidator';

const createChapterGroup = async (req: Request, res: Response) => {
  try {
    const { boardId, examId, subjectId, name } = req.body;

    const validation = validateChapterGroup({ boardId, examId, subjectId, name });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await chapterGroupServices.createChapterGroup(boardId, examId, subjectId, name);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in createChapterGroup controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const updateChapterGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { boardId, examId, subjectId, name } = req.body;

    // At least one field should be provided
    if (!boardId && !examId && !subjectId && !name) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'At least one field (boardId, examId, subjectId, or name) is required for update',
      });
    }

    const validation = validateChapterGroupUpdate({ boardId, examId, subjectId, name });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await chapterGroupServices.updateChapterGroup(id, boardId, examId, subjectId, name);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in updateChapterGroup controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getChapterGroups = async (req: Request, res: Response) => {
  try {
    const { subjectId, slug } = req.query;

    let result;
    if (slug) {
      result = await chapterGroupServices.getChapterGroupBySlug(slug as string);
    } else if (subjectId) {
      result = await chapterGroupServices.getChapterGroupsBySubjectId(subjectId as string);
    } else {
      result = await chapterGroupServices.getAllChapterGroups();
    }

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getChapterGroups controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getChapterGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await chapterGroupServices.getChapterGroupById(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getChapterGroup controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const deleteChapterGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await chapterGroupServices.deleteChapterGroup(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in deleteChapterGroup controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const chapterGroupController = {
  createChapterGroup,
  updateChapterGroup,
  getChapterGroups,
  getChapterGroup,
  deleteChapterGroup,
};

export default chapterGroupController;

