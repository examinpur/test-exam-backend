import mongoose from 'mongoose';
import Exam from '../../../models/examModel';
import Board from '../../../models/boardModel';
import { generateSlug } from '../../../utils/slug';
import { ExamResponse } from '../types/examTypes';
import { uploading } from '../../../utils/cloudinaryUpload';
import { I18nString } from '../../board/types/boardTypes';

const createExam = async (boardId: string, name: I18nString , file?: Express.Multer.File): Promise<ExamResponse> => {
  try {
    const board = await Board.findById(boardId);
    if (!board) {
      return {
        success: false,
        statusCode: 404,
        message: 'Board not found',
      };
    }

    const examSlug = generateSlug(name?.en);
    const boardSlug = board.slug;

    const existingExam = await Exam.findOne({ boardId, slug: examSlug });
    if (existingExam) {
      return {
        success: false,
        statusCode: 400,
        message: 'Exam with this name already exists for this board',
      };
    }

    const pathSlugs = [boardSlug, examSlug];
    const pathKey = `${boardSlug}/${examSlug}`;

    const maxOrderExam = await Exam.findOne({ boardId }).sort({ order: -1 });
    const nextOrder = maxOrderExam ? (maxOrderExam.order || 0) + 1 : 0;
    let image: any | null = await uploading(file);
    
    const exam = await Exam.create({
      boardId,
      name,
      slug: examSlug,
      order: nextOrder,
      isActive: true,
      boardSlug,
      pathSlugs,
      pathKey,
      image
    });

    return {
      success: true,
      statusCode: 201,
      message: 'Exam created successfully',
      data: exam,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while creating exam',
      error: error?.message || error,
    };
  }
};

const updateExam = async (
  id: string,
  updates: {
    boardId?: string;
    name?: I18nString;
    order?: number;
    isActive?: boolean;
  },
  file?: Express.Multer.File
): Promise<ExamResponse> => {
  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return { success: false, statusCode: 404, message: "Exam not found" };
    }

    const updateData: any = {};

    let newBoardId: mongoose.Types.ObjectId | string = exam.boardId;
    let boardSlug = exam.boardSlug;

    if (updates.boardId) {
      const board = await Board.findById(updates.boardId);
      if (!board) {
        return { success: false, statusCode: 404, message: "Board not found" };
      }

      const boardObjectId = new mongoose.Types.ObjectId(updates.boardId);
      newBoardId = boardObjectId;
      boardSlug = board.slug;

      updateData.boardId = boardObjectId;
      updateData.boardSlug = boardSlug;
    }

    if (updates.name) {
      const examSlug = generateSlug(updates.name.en);

      const existingExam = await Exam.findOne({
        boardId: newBoardId,
        slug: examSlug,
        _id: { $ne: id },
      });

      if (existingExam) {
        return {
          success: false,
          statusCode: 400,
          message: "Exam with this name already exists for this board",
        };
      }

      updateData.name = updates.name;     
      updateData.slug = examSlug;
      updateData.pathSlugs = [boardSlug, examSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}`;
    } else if (updates.boardId) {
      updateData.pathSlugs = [boardSlug, exam.slug];
      updateData.pathKey = `${boardSlug}/${exam.slug}`;
    }

    if (typeof updates.order === "number") updateData.order = updates.order;
    if (typeof updates.isActive === "boolean") updateData.isActive = updates.isActive;

    let image: any | null = await uploading(file);
    updateData.image = image;
    const updatedExam = await Exam.findByIdAndUpdate(id, updateData, { new: true });

    return {
      success: true,
      statusCode: 200,
      message: "Exam updated successfully",
      data: updatedExam,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Error occurred while updating exam",
      error: error?.message || error,
    };
  }
};

const getAllExams = async (): Promise<ExamResponse> => {
  try {
    const exams = await Exam.find().sort({ order: 1 })
                        .populate('boardId', 'name order isActive');

    return {
      success: true,
      statusCode: 200,
      message: 'Exams fetched successfully',
      data: exams,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching exams',
      error: error?.message || error,
    };
  }
};

const getExamById = async (id: string): Promise<ExamResponse> => {
  try {
    const exam = await Exam.findById(id);

    if (!exam) {
      return {
        success: false,
        statusCode: 404,
        message: 'Exam not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Exam fetched successfully',
      data: exam,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching exam',
      error: error?.message || error,
    };
  }
};

const getExamBySlug = async (slug: string): Promise<ExamResponse> => {
  try {
    const exam = await Exam.findOne({ slug });

    if (!exam) {
      return {
        success: false,
        statusCode: 404,
        message: 'Exam not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Exam fetched successfully',
      data: exam,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching exam',
      error: error?.message || error,
    };
  }
};

const getExamsByBoardId = async (boardId: string): Promise<ExamResponse> => {
  try {
    const exams = await Exam.find({ boardId }).sort({ order: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Exams fetched successfully',
      data: exams,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching exams',
      error: error?.message || error,
    };
  }
};

const deleteExam = async (id: string): Promise<ExamResponse> => {
  try {
    const exam = await Exam.findByIdAndDelete(id);

    if (!exam) {
      return {
        success: false,
        statusCode: 404,
        message: 'Exam not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Exam deleted successfully',
      data: exam,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while deleting exam',
      error: error?.message || error,
    };
  }
};

const examServices = {
  createExam,
  updateExam,
  getAllExams,
  getExamById,
  getExamBySlug,
  getExamsByBoardId,
  deleteExam,
};

export default examServices;

