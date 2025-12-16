import mongoose from 'mongoose';
import Exam from '../../../models/examModel';
import Board from '../../../models/boardModel';
import { generateSlug } from '../../../utils/slug';
import { ExamResponse } from '../types/examTypes';

const createExam = async (boardId: string, name: string): Promise<ExamResponse> => {
  try {
    // Validate board exists
    const board = await Board.findById(boardId);
    if (!board) {
      return {
        success: false,
        statusCode: 404,
        message: 'Board not found',
      };
    }

    const examSlug = generateSlug(name);
    const boardSlug = board.slug;

    // Check if exam with same slug already exists for this board
    const existingExam = await Exam.findOne({ boardId, slug: examSlug });
    if (existingExam) {
      return {
        success: false,
        statusCode: 400,
        message: 'Exam with this name already exists for this board',
      };
    }

    // Create pathSlugs and pathKey
    const pathSlugs = [boardSlug, examSlug];
    const pathKey = `${boardSlug}/${examSlug}`;

    // Get the current max order for this board
    const maxOrderExam = await Exam.findOne({ boardId }).sort({ order: -1 });
    const nextOrder = maxOrderExam ? (maxOrderExam.order || 0) + 1 : 0;

    const exam = await Exam.create({
      boardId,
      name,
      slug: examSlug,
      order: nextOrder,
      isActive: true,
      boardSlug,
      pathSlugs,
      pathKey,
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

const updateExam = async (id: string, boardId: string | undefined, name: string | undefined): Promise<ExamResponse> => {
  try {
    const exam = await Exam.findById(id);
    if (!exam) {
      return {
        success: false,
        statusCode: 404,
        message: 'Exam not found',
      };
    }

    let updateData: any = {};
    let newBoardId: mongoose.Types.ObjectId | string = exam.boardId;
    let newName = exam.name;

    // If boardId is provided, validate it exists
    if (boardId) {
      const board = await Board.findById(boardId);
      if (!board) {
        return {
          success: false,
          statusCode: 404,
          message: 'Board not found',
        };
      }
      const boardObjectId = new mongoose.Types.ObjectId(boardId);
      newBoardId = boardObjectId;
      updateData.boardId = boardObjectId;
      updateData.boardSlug = board.slug;
    }

    // If name is provided, update slug and path fields
    if (name) {
      newName = name;
      const examSlug = generateSlug(name);
      const boardSlug = updateData.boardSlug || exam.boardSlug;

      // Check if another exam with same slug exists for this board
      const existingExam = await Exam.findOne({
        boardId: newBoardId,
        slug: examSlug,
        _id: { $ne: id },
      });
      if (existingExam) {
        return {
          success: false,
          statusCode: 400,
          message: 'Exam with this name already exists for this board',
        };
      }

      updateData.name = name;
      updateData.slug = examSlug;
      updateData.pathSlugs = [boardSlug, examSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}`;
    } else if (boardId) {
      // If only boardId is updated, we need to update path fields with existing slug
      const examSlug = exam.slug;
      const boardSlug = updateData.boardSlug;
      updateData.pathSlugs = [boardSlug, examSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}`;
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Exam updated successfully',
      data: updatedExam,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while updating exam',
      error: error?.message || error,
    };
  }
};

const getAllExams = async (): Promise<ExamResponse> => {
  try {
    const exams = await Exam.find().sort({ order: 1 });

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

