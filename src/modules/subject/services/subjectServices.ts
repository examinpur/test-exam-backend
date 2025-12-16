import Subject from '../../../models/subjectModel';
import Exam from '../../../models/examModel';
import { generateSlug } from '../../../utils/slug';
import { SubjectResponse } from '../types/subjectTypes';

const createSubject = async (boardId: string, examId: string, name: string): Promise<SubjectResponse> => {
  try {
    // Validate exam exists and get board info
    const exam = await Exam.findById(examId);
    if (!exam) {
      return {
        success: false,
        statusCode: 404,
        message: 'Exam not found',
      };
    }

    // Verify exam belongs to the board
    if (exam.boardId.toString() !== boardId) {
      return {
        success: false,
        statusCode: 400,
        message: 'Exam does not belong to the specified board',
      };
    }

    const subjectSlug = generateSlug(name);
    const boardSlug = exam.boardSlug;
    const examSlug = exam.slug;

    // Check if subject with same slug already exists for this exam
    const existingSubject = await Subject.findOne({ examId, slug: subjectSlug });
    if (existingSubject) {
      return {
        success: false,
        statusCode: 400,
        message: 'Subject with this name already exists for this exam',
      };
    }

    // Create pathSlugs and pathKey
    const pathSlugs = [boardSlug, examSlug, subjectSlug];
    const pathKey = `${boardSlug}/${examSlug}/${subjectSlug}`;

    // Get the current max order for this exam
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
  boardId: string | undefined,
  examId: string | undefined,
  name: string | undefined,
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

    let updateData: any = {};
    let newBoardId = subject.boardId.toString();
    let newExamId = subject.examId.toString();
    let newName = subject.name;

    // If examId is provided, validate it exists and get board info
    if (examId) {
      const exam = await Exam.findById(examId);
      if (!exam) {
        return {
          success: false,
          statusCode: 404,
          message: 'Exam not found',
        };
      }

      // If boardId is also provided, verify they match
      if (boardId && exam.boardId.toString() !== boardId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Exam does not belong to the specified board',
        };
      }

      newBoardId = exam.boardId.toString();
      newExamId = examId;
      updateData.examId = examId;
      updateData.boardId = exam.boardId;
      updateData.boardSlug = exam.boardSlug;
      updateData.examSlug = exam.slug;
    } else if (boardId) {
      // If only boardId is provided, verify current exam belongs to it
      const exam = await Exam.findById(subject.examId);
      if (exam && exam.boardId.toString() !== boardId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Current exam does not belong to the specified board',
        };
      }
    }

    // If name is provided, update slug and path fields
    if (name) {
      newName = name;
      const subjectSlug = generateSlug(name);
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

      // Check if another subject with same slug exists for this exam
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

      updateData.name = name;
      updateData.slug = subjectSlug;
      updateData.pathSlugs = [boardSlug, examSlug, subjectSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}/${subjectSlug}`;
    } else if (examId || boardId) {
      // If only examId/boardId is updated, we need to update path fields with existing slug
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
    const subjects = await Subject.find().sort({ order: 1 });

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
