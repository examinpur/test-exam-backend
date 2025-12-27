import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import chapterServices from '../services/chapterServices';
import { validateChapter, validateChapterUpdate } from '../validation/chapterValidator';

const createChapter = async (req: Request, res: Response) => {
  try {
    const { boardId, examId, subjectId, chapterGroupId, name } = req.body;

    const validation = validateChapter({ boardId, examId, subjectId, chapterGroupId, name });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await chapterServices.createChapter(boardId, examId, subjectId, chapterGroupId, name);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in createChapter controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const updateChapter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { boardId, examId, subjectId, chapterGroupId, name } = req.body;

    // At least one field should be provided
    if (!boardId && !examId && !subjectId && !chapterGroupId && !name) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'At least one field (boardId, examId, subjectId, chapterGroupId, or name) is required for update',
      });
    }

    const validation = validateChapterUpdate({ boardId, examId, subjectId, chapterGroupId, name });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const result = await chapterServices.updateChapter(id, boardId, examId, subjectId, chapterGroupId, name);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in updateChapter controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getChapters = async (req: Request, res: Response) => {
  try {

    const { chapterGroupId, boardSlug , examSlug, subjectSlug, chapterGroupSlug, chapterSlug , slug } = req.query;

    let result;
   if (boardSlug && examSlug && subjectSlug && chapterGroupSlug && chapterSlug) {
  result = await chapterServices.getChapterByPath({
    boardSlug: String(boardSlug),
    examSlug: String(examSlug),
    subjectSlug: String(subjectSlug),
    chapterGroupSlug: String(chapterGroupSlug),
    chapterSlug: String(chapterSlug),
    onlyActive: true,
  }) 
 } else if (chapterGroupId) {
      result = await chapterServices.getChaptersByChapterGroupId(chapterGroupId as string);
    }  else if (slug){
      result = await chapterServices.getChapterBySlug(slug as string);
    }else {
      result = await chapterServices.getAllChapters();
    }

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getChapters controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const getChapter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await chapterServices.getChapterById(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in getChapter controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const deleteChapter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await chapterServices.deleteChapter(id);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in deleteChapter controller: ${error?.message || error?.response?.error?.message || error?.response?.error || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error?.message || error,
    });
  }
};

const chapterController = {
  createChapter,
  updateChapter,
  getChapters,
  getChapter,
  deleteChapter,
};

export default chapterController;
