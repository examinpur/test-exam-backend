import { Request, Response } from "express";
import logger from "../../../utils/logger";
import paperServices from "../services/paperServices";
import { validatePaper, validatePaperUpdate, validateBulkPaperUpload } from "../validation/paperValidator";


const parseBulkJsonFromRequest = (req: Request): any[] => {
  const files = req.files as any;
  const dataFile = files?.data?.[0];
  if (dataFile?.buffer) {
    const raw = dataFile.buffer.toString("utf-8");
    return JSON.parse(raw);
  }

  if (typeof (req.body as any)?.data === "string") {
    return JSON.parse((req.body as any).data);
  }

  if (Array.isArray(req.body)) return req.body;

  throw new Error("No valid JSON data found (send file field 'data' or body.data)");
};

const bulkUploadPapers = async (req: Request, res: Response) => {
  try {
    const dataset = parseBulkJsonFromRequest(req);

    const validation = validateBulkPaperUpload(dataset);
    if (!validation.success) {
      const parsed = JSON.parse(validation.error.message);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${parsed?.[0]?.path?.join(".")} - ${parsed?.[0]?.message}`,
        error: parsed,
      });
    }

    const files = req.files as any;
    const zipFile = files?.imagesZip?.[0];
    const zipBuffer: Buffer | undefined = zipFile?.buffer;

    const result = await paperServices.bulkUploadPapersWithQuestions(validation.data, zipBuffer);

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(`Error occurred in bulkUploadPapers controller: ${error?.message || error}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error",
      error: error?.message || error,
    });
  }
};

const createPaper = async (req: Request, res: Response) => {
  try {
    const { boardId, examId, name, year, shift, examSchedule } = req.body;

    const validation = validatePaper({ boardId, examId, name, year, shift, examSchedule });
    if (!validation.success) {
      const parsed = JSON.parse(validation?.error?.message);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${parsed?.[0]?.path?.[0]} - ${parsed?.[0]?.message}`,
        error: parsed || validation?.error || validation,
      });
    }

    const result = await paperServices.createPaper(boardId, examId, name, year, shift, examSchedule);
    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred in createPaper controller: ${
        error?.message || error?.response?.error?.message || error?.response?.error || error
      }`,
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error",
      error: error?.message || error,
    });
  }
};

const updatePaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { boardId, examId, name, year, shift, questionCount, examSchedule } = req.body;

    const validation = validatePaperUpdate({ boardId, examId, name, year, shift, questionCount, examSchedule });
    if (!validation.success) {
      const parsed = JSON.parse(validation?.error?.message);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${parsed?.[0]?.path?.[0]} - ${parsed?.[0]?.message}`,
        error: parsed || validation?.error || validation,
      });
    }

    const result = await paperServices.updatePaper(
      id,
      boardId,
      examId,
      name,
      year,
      shift,
      questionCount,
      examSchedule,
    );

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred in updatePaper controller: ${
        error?.message || error?.response?.error?.message || error?.response?.error || error
      }`,
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error",
      error: error?.message || error,
    });
  }
};

const getPapers = async (req: Request, res: Response) => {
  try {
    const { examId, slug } = req.query;

    let result;
    if (slug) result = await paperServices.getPaperBySlug(slug as string);
    else if (examId) result = await paperServices.getPapersByExamId(examId as string);
    else result = await paperServices.getAllPapers();

    return res.status(result.statusCode).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred in getPapers controller: ${
        error?.message || error?.response?.error?.message || error?.response?.error || error
      }`,
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error",
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
    logger.error(
      `Error occurred in getPaper controller: ${
        error?.message || error?.response?.error?.message || error?.response?.error || error
      }`,
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error",
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
    logger.error(
      `Error occurred in deletePaper controller: ${
        error?.message || error?.response?.error?.message || error?.response?.error || error
      }`,
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error",
      error: error?.message || error,
    });
  }
};

export default {
  createPaper,
  updatePaper,
  getPapers,
  getPaper,
  deletePaper,
  bulkUploadPapers
};
