import Paper from "../../../models/paperModel";
import Exam from "../../../models/examModel";
import { generateSlug } from "../../../utils/slug";
import { BulkPaperUploadItem, BulkPaperUploadResult, PaperResponse } from "../types/paperTypes";
import { bulkCreateQuestions } from "../../question/helper/bulkSaveQuestions";
import Question from '../../../models/questionModel';

const buildPaperSlug = (year: number, name: string): string => {
  const slug = generateSlug(name);
  return `${year}-${slug}`;
};

type ExamScheduleInput = {
  date?: string;    
  timing?: string;   
  duration?: string; 
};

const createPaper = async (
  boardId: string,
  examId: string,
  name: string,
  year: number,
  shift?: string,
  examSchedule?: ExamScheduleInput,
): Promise<PaperResponse> => {
  try {
    const exam = await Exam.findById(examId);
    if (!exam) {
      return { success: false, statusCode: 404, message: "Exam not found" };
    }

    if (exam.boardId.toString() !== boardId) {
      return { success: false, statusCode: 400, message: "Exam does not belong to the specified board" };
    }

    const slug = buildPaperSlug(year, name);
    const boardSlug = exam.boardSlug;
    const examSlug = exam.slug;

    const existing = await Paper.findOne({ examId, slug });
    if (existing) {
      return { success: false, statusCode: 400, message: "Paper with this name already exists for this exam" };
    }

    const pathSlugs = [boardSlug, examSlug, slug];
    const pathKey = `${boardSlug}/${examSlug}/${slug}`;

    const paper = await Paper.create({
      boardId,
      examId,
      name,
      slug,
      year,
      shift: shift || "",
      isActive: true,
      boardSlug,
      examSlug,
      pathSlugs,
      pathKey,
      questionCount: 0,
      examSchedule: examSchedule ?? null,
    });

    return { success: true, statusCode: 201, message: "Paper created successfully", data: paper };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Error occurred while creating paper",
      error: error?.message || error,
    };
  }
};

const updatePaper = async (
  id: string,
  boardId?: string,
  examId?: string,
  name?: string,
  year?: number,
  shift?: string,
  questionCount?: number,
  examSchedule?: ExamScheduleInput,
): Promise<PaperResponse> => {
  try {
    const paper = await Paper.findById(id);
    if (!paper) {
      return { success: false, statusCode: 404, message: "Paper not found" };
    }

    const updateData: any = {};
    if (examId) {
      const exam = await Exam.findById(examId);
      if (!exam) return { success: false, statusCode: 404, message: "Exam not found" };

      const newBoardId = boardId || exam.boardId.toString();
      if (exam.boardId.toString() !== newBoardId) {
        return { success: false, statusCode: 400, message: "Exam does not belong to the specified board" };
      }

      updateData.examId = examId;
      updateData.boardId = newBoardId;
      updateData.boardSlug = exam.boardSlug;
      updateData.examSlug = exam.slug;
    } else if (boardId && paper.examId) {
      const exam = await Exam.findById(paper.examId);
      if (!exam || exam.boardId.toString() !== boardId) {
        return { success: false, statusCode: 400, message: "Board does not match exam" };
      }
      updateData.boardId = boardId;
      updateData.boardSlug = exam.boardSlug;
    }

    if (name !== undefined) updateData.name = name;
    if (year !== undefined) updateData.year = year;
    if (shift !== undefined) updateData.shift = shift;
    if (questionCount !== undefined) updateData.questionCount = questionCount;
    if (examSchedule !== undefined) updateData.examSchedule = examSchedule;
    if (name !== undefined || year !== undefined) {
      const finalName = name ?? paper.name;
      const finalYear = year ?? paper.year;

      const newSlug = buildPaperSlug(finalYear, finalName);

      const existing = await Paper.findOne({
        examId: updateData.examId || paper.examId,
        slug: newSlug,
        _id: { $ne: id },
      });

      if (existing) {
        return { success: false, statusCode: 400, message: "Paper with this name already exists for this exam" };
      }

      updateData.slug = newSlug;
    }
    if (updateData.slug || updateData.examId || updateData.boardId) {
      const finalExamId = updateData.examId || paper.examId;
      const exam = await Exam.findById(finalExamId);

      if (exam) {
        const boardSlug = updateData.boardSlug || exam.boardSlug;
        const examSlug = updateData.examSlug || exam.slug;
        const finalSlug = updateData.slug || paper.slug;

        updateData.pathSlugs = [boardSlug, examSlug, finalSlug];
        updateData.pathKey = `${boardSlug}/${examSlug}/${finalSlug}`;
      }
    }

    const updated = await Paper.findByIdAndUpdate(id, updateData, { new: true });

    return { success: true, statusCode: 200, message: "Paper updated successfully", data: updated };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Error occurred while updating paper",
      error: error?.message || error,
    };
  }
};

const getAllPapers = async (): Promise<PaperResponse> => {
  try {
    const papers = await Paper.find().sort({ year: -1, slug: 1 });
    return { success: true, statusCode: 200, message: "Papers fetched successfully", data: papers };
  } catch (error: any) {
    return { success: false, statusCode: 500, message: "Error occurred while fetching papers", error: error?.message || error };
  }
};

const getPaperById = async (id: string): Promise<PaperResponse> => {
  try {
    const paper = await Paper.findById(id);
    if (!paper) return { success: false, statusCode: 404, message: "Paper not found" };
    return { success: true, statusCode: 200, message: "Paper fetched successfully", data: paper };
  } catch (error: any) {
    return { success: false, statusCode: 500, message: "Error occurred while fetching paper", error: error?.message || error };
  }
};

const getPaperBySlug = async (slug: string): Promise<PaperResponse> => {
  try {
    const paper = await Paper.findOne({ slug });
    if (!paper) return { success: false, statusCode: 404, message: "Paper not found" };
    return { success: true, statusCode: 200, message: "Paper fetched successfully", data: paper };
  } catch (error: any) {
    return { success: false, statusCode: 500, message: "Error occurred while fetching paper", error: error?.message || error };
  }
};

const getPapersByExamId = async (examId: string): Promise<PaperResponse> => {
  try {
    const papers = await Paper.find({ examId }).sort({ year: -1, slug: 1 });
    return { success: true, statusCode: 200, message: "Papers fetched successfully", data: papers };
  } catch (error: any) {
    return { success: false, statusCode: 500, message: "Error occurred while fetching papers", error: error?.message || error };
  }
};

const deletePaper = async (id: string): Promise<PaperResponse> => {
  try {
    const paper = await Paper.findByIdAndDelete(id);
    if (!paper) return { success: false, statusCode: 404, message: "Paper not found" };
    return { success: true, statusCode: 200, message: "Paper deleted successfully", data: paper };
  } catch (error: any) {
    return { success: false, statusCode: 500, message: "Error occurred while deleting paper", error: error?.message || error };
  }
};


const inferYearFromItem = (item: BulkPaperUploadItem): number | null => {
  if (item.date && /^\d{2}\/\d{2}\/\d{4}$/.test(item.date)) {
    const y = Number(item.date.split("/")[2]);
    if (!Number.isNaN(y)) return y;
  }
  const m = String(item.name || "").match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);
  if (m?.[1]) return Number(m[1]);

  return null;
};

const resolveExamByNameOrSlug = async (examText: string) => {
  const s = generateSlug(examText);

  let exam = await Exam.findOne({ slug: s }).lean();
  if (exam) return exam;

  exam = await Exam.findOne({ "name.en": { $regex: new RegExp(examText, "i") } }).lean();
  if (exam) return exam;

  exam = await Exam.findOne({ "name.hi": { $regex: new RegExp(examText, "i") } }).lean();
  if (exam) return exam;

  return null;
};

const syncPaperQuestionCounts = async (paperIds: any[]) => {
  if (!paperIds || paperIds.length === 0) return;

  const counts = await Question.aggregate([
    { $match: { paperRefId: { $in: paperIds } } },
    { $group: { _id: "$paperRefId", count: { $sum: 1 } } },
  ]);

  const map = new Map<string, number>();
  for (const c of counts) map.set(String(c._id), Number(c.count) || 0);

  const ops = paperIds.map((id) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { questionCount: map.get(String(id)) ?? 0 } },
    },
  }));

  if (ops.length > 0) await Paper.bulkWrite(ops);
};

export const bulkUploadPapersWithQuestions = async (
  items: BulkPaperUploadItem[],
  zipBuffer?: Buffer,
): Promise<BulkPaperUploadResult> => {
  const paperStats = {
    total: items.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    faulty: [] as Array<{ name?: string; exam?: string; reason: string }>,
  };

  try {
    const paperDocs: any[] = [];
    const allQuestions: any[] = [];

    for (const item of items) {
      try {
        const exam = await resolveExamByNameOrSlug(item.exam);
        if (!exam) {
          paperStats.failed++;
          paperStats.faulty.push({ name: item.name, exam: item.exam, reason: "Exam not found" });
          continue;
        }

        const year = inferYearFromItem(item);
        if (!year) {
          paperStats.failed++;
          paperStats.faulty.push({ name: item.name, exam: item.exam, reason: "Could not infer year from date/name" });
          continue;
        }

        const slug = buildPaperSlug(year, item.name);

        const boardId = exam.boardId;
        const examId = exam._id;

        const boardSlug = exam.boardSlug;
        const examSlug = exam.slug;

        const pathSlugs = [boardSlug, examSlug, slug];
        const pathKey = `${boardSlug}/${examSlug}/${slug}`;

        const examSchedule =
          item.date || item.time || item.duration
            ? {
                date: item.date,
                timing: item.time,
                duration: item.duration,
              }
            : null;

        const existing = await Paper.findOne({ examId, slug });

        if (!existing) {
          const created = await Paper.create({
            boardId,
            examId,
            name: item.name,
            slug,
            year,
            shift: item.shift || "",
            isActive: true,
            boardSlug,
            examSlug,
            pathSlugs,
            pathKey,
            questionCount: 0,
            examSchedule,
          });

          paperStats.created++;
          paperDocs.push(created);
        } else {
          existing.name = item.name;
          existing.year = year;
          existing.shift = item.shift || existing.shift || "";
          existing.examSchedule = examSchedule;
          existing.boardSlug = boardSlug;
          existing.examSlug = examSlug;
          existing.pathSlugs = pathSlugs;
          existing.pathKey = pathKey;

          await existing.save();

          paperStats.updated++;
          paperDocs.push(existing);
        }

        const thisPaper = paperDocs[paperDocs.length - 1];

        for (const q of item.questions || []) {
          const cloned = { ...q, paperId: thisPaper.slug };
          allQuestions.push(cloned);
        }
      } catch (e: any) {
        paperStats.failed++;
        paperStats.faulty.push({
          name: item.name,
          exam: item.exam,
          reason: e?.message || "Paper create/update failed",
        });
      }
    }

    let questionResult: any = {
      total: 0,
      created: 0,
      failed: 0,
      faultyCount: 0,
      faulty: [],
      imagesUploaded: 0,
    };

    if (allQuestions.length > 0) {
      questionResult = await bulkCreateQuestions([{ questions: allQuestions }], zipBuffer, { concurrency: 10 });
    }

    // 3) Sync paper question counts
    await syncPaperQuestionCounts(paperDocs.map((p) => p._id));

    return {
      success: true,
      statusCode: 201,
      message: "Bulk paper upload completed",
      papers: paperStats,
      questions: questionResult,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Bulk paper upload failed",
      papers: paperStats,
      questions: null,
    };
  }
};


export default {
  createPaper,
  updatePaper,
  getAllPapers,
  getPaperById,
  getPaperBySlug,
  getPapersByExamId,
  deletePaper,
  bulkUploadPapersWithQuestions
};
