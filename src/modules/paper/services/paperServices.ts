import Paper from '../../../models/paperModel';
import Exam from '../../../models/examModel';
import { generateSlug } from '../../../utils/slug';
import { PaperResponse } from '../types/paperTypes';

const createPaper = async (
  boardId: string,
  examId: string,
  name: string,
  year: number,
  paperNumber?: number,
  shift?: string,
): Promise<PaperResponse> => {
  try {
    const exam = await Exam.findById(examId);
    if (!exam) {
      return {
        success: false,
        statusCode: 404,
        message: 'Exam not found',
      };
    }

    if (exam.boardId.toString() !== boardId) {
      return {
        success: false,
        statusCode: 400,
        message: 'Exam does not belong to the specified board',
      };
    }

    const slug = generateSlug(name);
    const boardSlug = exam.boardSlug;
    const examSlug = exam.slug;

    const existingPaper = await Paper.findOne({ examId, slug });
    if (existingPaper) {
      return {
        success: false,
        statusCode: 400,
        message: 'Paper with this name already exists for this exam',
      };
    }

    const pathSlugs = [boardSlug, examSlug, slug];
    const pathKey = `${boardSlug}/${examSlug}/${slug}`;

    const paper = await Paper.create({
      boardId,
      examId,
      name,
      slug,
      year,
      paperNumber: paperNumber || 1,
      shift: shift || '',
      isActive: true,
      boardSlug,
      examSlug,
      pathSlugs,
      pathKey,
      questionPathKeys: [],
      questionCount: 0,
    });

    return {
      success: true,
      statusCode: 201,
      message: 'Paper created successfully',
      data: paper,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while creating paper',
      error: error?.message || error,
    };
  }
};

const updatePaper = async (
  id: string,
  boardId: string | undefined,
  examId: string | undefined,
  name: string | undefined,
  year: number | undefined,
  paperNumber: number | undefined,
  shift: string | undefined,
  questionPathKeys: string[] | undefined,
  questionCount: number | undefined,
): Promise<PaperResponse> => {
  try {
    const paper = await Paper.findById(id);
    if (!paper) {
      return {
        success: false,
        statusCode: 404,
        message: 'Paper not found',
      };
    }

    const updateData: any = {};

    if (examId) {
      const exam = await Exam.findById(examId);
      if (!exam) {
        return {
          success: false,
          statusCode: 404,
          message: 'Exam not found',
        };
      }

      const newBoardId = boardId || exam.boardId.toString();
      if (exam.boardId.toString() !== newBoardId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Exam does not belong to the specified board',
        };
      }

      updateData.examId = examId;
      updateData.boardId = newBoardId;
      updateData.boardSlug = exam.boardSlug;
      updateData.examSlug = exam.slug;
    } else if (boardId && paper.examId) {
      const exam = await Exam.findById(paper.examId);
      if (!exam || exam.boardId.toString() !== boardId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Board does not match exam',
        };
      }
      updateData.boardId = boardId;
      updateData.boardSlug = exam.boardSlug;
    }

    if (name) {
      const slug = generateSlug(name);
      const existingPaper = await Paper.findOne({
        examId: updateData.examId || paper.examId,
        slug,
        _id: { $ne: id },
      });

      if (existingPaper) {
        return {
          success: false,
          statusCode: 400,
          message: 'Paper with this name already exists for this exam',
        };
      }

      updateData.name = name;
      updateData.slug = slug;
    }

    if (year !== undefined) {
      updateData.year = year;
    }

    if (paperNumber !== undefined) {
      updateData.paperNumber = paperNumber;
    }

    if (shift !== undefined) {
      updateData.shift = shift;
    }

    if (questionPathKeys !== undefined) {
      updateData.questionPathKeys = questionPathKeys;
    }

    if (questionCount !== undefined) {
      updateData.questionCount = questionCount;
    }

    if (updateData.name || updateData.examId || updateData.boardId) {
      const finalExamId = updateData.examId || paper.examId;
      const exam = await Exam.findById(finalExamId);
      if (exam) {
        const boardSlug = updateData.boardSlug || exam.boardSlug;
        const examSlug = updateData.examSlug || exam.slug;
        const slug = updateData.slug || paper.slug;
        updateData.pathSlugs = [boardSlug, examSlug, slug];
        updateData.pathKey = `${boardSlug}/${examSlug}/${slug}`;
      }
    }

    const updatedPaper = await Paper.findByIdAndUpdate(id, updateData, { new: true });

    return {
      success: true,
      statusCode: 200,
      message: 'Paper updated successfully',
      data: updatedPaper,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while updating paper',
      error: error?.message || error,
    };
  }
};

const getAllPapers = async (): Promise<PaperResponse> => {
  try {
    const papers = await Paper.find().sort({ year: -1, paperNumber: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Papers fetched successfully',
      data: papers,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching papers',
      error: error?.message || error,
    };
  }
};

const getPaperById = async (id: string): Promise<PaperResponse> => {
  try {
    const paper = await Paper.findById(id);

    if (!paper) {
      return {
        success: false,
        statusCode: 404,
        message: 'Paper not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Paper fetched successfully',
      data: paper,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching paper',
      error: error?.message || error,
    };
  }
};

const getPaperBySlug = async (slug: string): Promise<PaperResponse> => {
  try {
    const paper = await Paper.findOne({ slug });

    if (!paper) {
      return {
        success: false,
        statusCode: 404,
        message: 'Paper not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Paper fetched successfully',
      data: paper,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching paper',
      error: error?.message || error,
    };
  }
};

const getPapersByExamId = async (examId: string): Promise<PaperResponse> => {
  try {
    const papers = await Paper.find({ examId }).sort({ year: -1, paperNumber: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Papers fetched successfully',
      data: papers,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching papers',
      error: error?.message || error,
    };
  }
};

const deletePaper = async (id: string): Promise<PaperResponse> => {
  try {
    const paper = await Paper.findByIdAndDelete(id);

    if (!paper) {
      return {
        success: false,
        statusCode: 404,
        message: 'Paper not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Paper deleted successfully',
      data: paper,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while deleting paper',
      error: error?.message || error,
    };
  }
};

const paperServices = {
  createPaper,
  updatePaper,
  getAllPapers,
  getPaperById,
  getPaperBySlug,
  getPapersByExamId,
  deletePaper,
};

export default paperServices;

