import Subject from '../../../models/subjectModel';
import Exam from '../../../models/examModel';
import { generateSlug } from '../../../utils/slug';
import { SubjectResponse } from '../types/subjectTypes';
import { I18nString } from '../../board/types/boardTypes';

const createSubject = async (boardId: string, examId: string, name: I18nString): Promise<SubjectResponse> => {
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

    const subjectSlug = generateSlug(name?.en);
    const boardSlug = exam.boardSlug;
    const examSlug = exam.slug;

    const existingSubject = await Subject.findOne({ examId, slug: subjectSlug });
    if (existingSubject) {
      return {
        success: false,
        statusCode: 400,
        message: 'Subject with this name already exists for this exam',
      };
    }

    const pathSlugs = [boardSlug, examSlug, subjectSlug];
    const pathKey = `${boardSlug}/${examSlug}/${subjectSlug}`;

    const maxOrderSubject = await Subject.findOne({ examId }).sort({ order: -1 });
    const nextOrder = maxOrderSubject ? (maxOrderSubject.order || 0) + 1 : 0;

    const subject = await Subject.create({
      boardId,
      examId,
      name,
      slug: subjectSlug,
      order: nextOrder,
      isActive: true,
      boardSlug,
      examSlug,
      pathSlugs,
      pathKey,
    });

    return {
      success: true,
      statusCode: 201,
      message: 'Subject created successfully',
      data: subject,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while creating subject',
      error: error?.message || error,
    };
  }
};

const updateSubject = async (
  id: string,
  updates: {
    boardId?: string;
    examId?: string;
    name?: I18nString;
    order?: number;
    isActive?: boolean;
  },
): Promise<SubjectResponse> => {
  try {
    const subject = await Subject.findById(id);
    if (!subject) {
      return {
        success: false,
        statusCode: 404,
        message: 'Subject not found',
      };
    }
    console.log('updates', updates);
    let updateData: any = {};
    let newBoardId = subject.boardId.toString();
    let newExamId = subject.examId.toString();
    let newName = subject.name;

    if (updates.examId) {
      const exam = await Exam.findById(updates.examId);
      if (!exam) {
        return {
          success: false,
          statusCode: 404,
          message: 'Exam not found',
        };
      }

      if (updates.boardId && exam.boardId.toString() !== updates.boardId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Exam does not belong to the specified board',
        };
      }

      newBoardId = exam.boardId.toString();
      newExamId = updates.examId;
      updateData.examId = updates.examId;
      updateData.boardId = exam.boardId;
      updateData.boardSlug = exam.boardSlug;
      updateData.examSlug = exam.slug;
    } else if (updates.boardId) {
      const exam = await Exam.findById(subject.examId);
      if (exam && exam.boardId.toString() !== updates.boardId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Current exam does not belong to the specified board',
        };
      }
    }
    if (updates.name) {
      newName = updates.name;
      const subjectSlug = generateSlug(updates.name.en);
      const exam = await Exam.findById(newExamId);
      if (!exam) {
        return {
          success: false,
          statusCode: 404,
          message: 'Exam not found',
        };
      }

      const boardSlug = updateData.boardSlug || exam.boardSlug;
      const examSlug = updateData.examSlug || exam.slug;

      const existingSubject = await Subject.findOne({
        examId: newExamId,
        slug: subjectSlug,
        _id: { $ne: id },
      });
      if (existingSubject) {
        return {
          success: false,
          statusCode: 400,
          message: 'Subject with this name already exists for this exam',
        };
      }

      updateData.name = updates.name;
      updateData.slug = subjectSlug;
      updateData.pathSlugs = [boardSlug, examSlug, subjectSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}/${subjectSlug}`;
    } else if (updates.examId || updates.boardId) {
      const exam = await Exam.findById(newExamId);
      if (!exam) {
        return {
          success: false,
          statusCode: 404,
          message: 'Exam not found',
        };
      }

      const subjectSlug = subject.slug;
      const boardSlug = updateData.boardSlug || exam.boardSlug;
      const examSlug = updateData.examSlug || exam.slug;
      updateData.pathSlugs = [boardSlug, examSlug, subjectSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}/${subjectSlug}`;
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Subject updated successfully',
      data: updatedSubject,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while updating subject',
      error: error?.message || error,
    };
  }
};

const getAllSubjects = async (): Promise<SubjectResponse> => {
  try {
    const subjects = await Subject.find().sort({ order: 1 })

    return {
      success: true,
      statusCode: 200,
      message: 'Subjects fetched successfully',
      data: subjects,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching subjects',
      error: error?.message || error,
    };
  }
};

const getSubjectById = async (id: string): Promise<SubjectResponse> => {
  try {
    const subject = await Subject.findById(id);

    if (!subject) {
      return {
        success: false,
        statusCode: 404,
        message: 'Subject not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Subject fetched successfully',
      data: subject,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching subject',
      error: error?.message || error,
    };
  }
};

const getSubjectBySlug = async (slug: string): Promise<SubjectResponse> => {
  try {
    const subject = await Subject.findOne({ slug });

    if (!subject) {
      return {
        success: false,
        statusCode: 404,
        message: 'Subject not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Subject fetched successfully',
      data: subject,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching subject',
      error: error?.message || error,
    };
  }
};

const getSubjectsByExamId = async (examId: string): Promise<SubjectResponse> => {
  try {
    const subjects = await Subject.find({ examId }).sort({ order: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Subjects fetched successfully',
      data: subjects,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching subjects',
      error: error?.message || error,
    };
  }
};

const deleteSubject = async (id: string): Promise<SubjectResponse> => {
  try {
    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      return {
        success: false,
        statusCode: 404,
        message: 'Subject not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Subject deleted successfully',
      data: subject,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while deleting subject',
      error: error?.message || error,
    };
  }
};

const subjectServices = {
  createSubject,
  updateSubject,
  getAllSubjects,
  getSubjectById,
  getSubjectBySlug,
  getSubjectsByExamId,
  deleteSubject,
};

export default subjectServices;
