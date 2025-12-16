import ChapterGroup from '../../../models/chapterGroupModel';
import Subject from '../../../models/subjectModel';
import Exam from '../../../models/examModel';
import { generateSlug } from '../../../utils/slug';
import { ChapterGroupResponse } from '../types/chapterGroupTypes';

const createChapterGroup = async (
  boardId: string,
  examId: string,
  subjectId: string,
  name: string,
): Promise<ChapterGroupResponse> => {
  try {
    // Validate subject exists and get exam/board info
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return {
        success: false,
        statusCode: 404,
        message: 'Subject not found',
      };
    }

    // Verify subject belongs to the exam and board
    if (subject.examId.toString() !== examId) {
      return {
        success: false,
        statusCode: 400,
        message: 'Subject does not belong to the specified exam',
      };
    }

    if (subject.boardId.toString() !== boardId) {
      return {
        success: false,
        statusCode: 400,
        message: 'Subject does not belong to the specified board',
      };
    }

    const chapterGroupSlug = generateSlug(name);
    const boardSlug = subject.boardSlug;
    const examSlug = subject.examSlug;
    const subjectSlug = subject.slug;

    // Check if chapterGroup with same slug already exists for this subject
    const existingChapterGroup = await ChapterGroup.findOne({ subjectId, slug: chapterGroupSlug });
    if (existingChapterGroup) {
      return {
        success: false,
        statusCode: 400,
        message: 'Chapter Group with this name already exists for this subject',
      };
    }

    // Create pathSlugs and pathKey
    const pathSlugs = [boardSlug, examSlug, subjectSlug, chapterGroupSlug];
    const pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterGroupSlug}`;

    // Get the current max order for this subject
    const maxOrderChapterGroup = await ChapterGroup.findOne({ subjectId }).sort({ order: -1 });
    const nextOrder = maxOrderChapterGroup ? (maxOrderChapterGroup.order || 0) + 1 : 0;

    const chapterGroup = await ChapterGroup.create({
      boardId,
      examId,
      subjectId,
      name,
      slug: chapterGroupSlug,
      order: nextOrder,
      isActive: true,
      boardSlug,
      examSlug,
      subjectSlug,
      pathSlugs,
      pathKey,
    });

    return {
      success: true,
      statusCode: 201,
      message: 'Chapter Group created successfully',
      data: chapterGroup,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while creating chapter group',
      error: error?.message || error,
    };
  }
};

const updateChapterGroup = async (
  id: string,
  boardId: string | undefined,
  examId: string | undefined,
  subjectId: string | undefined,
  name: string | undefined,
): Promise<ChapterGroupResponse> => {
  try {
    const chapterGroup = await ChapterGroup.findById(id);
    if (!chapterGroup) {
      return {
        success: false,
        statusCode: 404,
        message: 'Chapter Group not found',
      };
    }

    let updateData: any = {};
    let newBoardId = chapterGroup.boardId.toString();
    let newExamId = chapterGroup.examId.toString();
    let newSubjectId = chapterGroup.subjectId.toString();
    let newName = chapterGroup.name;

    // If subjectId is provided, validate it exists
    if (subjectId) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return {
          success: false,
          statusCode: 404,
          message: 'Subject not found',
        };
      }

      // Verify relationships
      if (examId && subject.examId.toString() !== examId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Subject does not belong to the specified exam',
        };
      }

      if (boardId && subject.boardId.toString() !== boardId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Subject does not belong to the specified board',
        };
      }

      newSubjectId = subjectId;
      newExamId = subject.examId.toString();
      newBoardId = subject.boardId.toString();
      updateData.subjectId = subjectId;
      updateData.examId = subject.examId;
      updateData.boardId = subject.boardId;
      updateData.subjectSlug = subject.slug;
      updateData.examSlug = subject.examSlug;
      updateData.boardSlug = subject.boardSlug;
    } else if (examId || boardId) {
      // If only examId or boardId is provided, get current subject
      const subject = await Subject.findById(chapterGroup.subjectId);
      if (subject) {
        if (examId && subject.examId.toString() !== examId) {
          return {
            success: false,
            statusCode: 400,
            message: 'Current subject does not belong to the specified exam',
          };
        }
        if (boardId && subject.boardId.toString() !== boardId) {
          return {
            success: false,
            statusCode: 400,
            message: 'Current subject does not belong to the specified board',
          };
        }
      }
    }

    // If name is provided, update slug and path fields
    if (name) {
      newName = name;
      const chapterGroupSlug = generateSlug(name);
      const subject = await Subject.findById(newSubjectId);
      if (!subject) {
        return {
          success: false,
          statusCode: 404,
          message: 'Subject not found',
        };
      }

      const boardSlug = updateData.boardSlug || subject.boardSlug;
      const examSlug = updateData.examSlug || subject.examSlug;
      const subjectSlug = updateData.subjectSlug || subject.slug;

      // Check if another chapterGroup with same slug exists for this subject
      const existingChapterGroup = await ChapterGroup.findOne({
        subjectId: newSubjectId,
        slug: chapterGroupSlug,
        _id: { $ne: id },
      });
      if (existingChapterGroup) {
        return {
          success: false,
          statusCode: 400,
          message: 'Chapter Group with this name already exists for this subject',
        };
      }

      updateData.name = name;
      updateData.slug = chapterGroupSlug;
      updateData.pathSlugs = [boardSlug, examSlug, subjectSlug, chapterGroupSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterGroupSlug}`;
    } else if (subjectId || examId || boardId) {
      // If only subjectId/examId/boardId is updated, we need to update path fields with existing slug
      const subject = await Subject.findById(newSubjectId);
      if (!subject) {
        return {
          success: false,
          statusCode: 404,
          message: 'Subject not found',
        };
      }

      const chapterGroupSlug = chapterGroup.slug;
      const boardSlug = updateData.boardSlug || subject.boardSlug;
      const examSlug = updateData.examSlug || subject.examSlug;
      const subjectSlug = updateData.subjectSlug || subject.slug;
      updateData.pathSlugs = [boardSlug, examSlug, subjectSlug, chapterGroupSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterGroupSlug}`;
    }

    const updatedChapterGroup = await ChapterGroup.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Chapter Group updated successfully',
      data: updatedChapterGroup,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while updating chapter group',
      error: error?.message || error,
    };
  }
};

const getAllChapterGroups = async (): Promise<ChapterGroupResponse> => {
  try {
    const chapterGroups = await ChapterGroup.find().sort({ order: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Chapter Groups fetched successfully',
      data: chapterGroups,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching chapter groups',
      error: error?.message || error,
    };
  }
};

const getChapterGroupById = async (id: string): Promise<ChapterGroupResponse> => {
  try {
    const chapterGroup = await ChapterGroup.findById(id);

    if (!chapterGroup) {
      return {
        success: false,
        statusCode: 404,
        message: 'Chapter Group not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Chapter Group fetched successfully',
      data: chapterGroup,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching chapter group',
      error: error?.message || error,
    };
  }
};

const getChapterGroupBySlug = async (slug: string): Promise<ChapterGroupResponse> => {
  try {
    const chapterGroup = await ChapterGroup.findOne({ slug });

    if (!chapterGroup) {
      return {
        success: false,
        statusCode: 404,
        message: 'Chapter Group not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Chapter Group fetched successfully',
      data: chapterGroup,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching chapter group',
      error: error?.message || error,
    };
  }
};

const getChapterGroupsBySubjectId = async (subjectId: string): Promise<ChapterGroupResponse> => {
  try {
    const chapterGroups = await ChapterGroup.find({ subjectId }).sort({ order: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Chapter Groups fetched successfully',
      data: chapterGroups,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching chapter groups',
      error: error?.message || error,
    };
  }
};

const deleteChapterGroup = async (id: string): Promise<ChapterGroupResponse> => {
  try {
    const chapterGroup = await ChapterGroup.findByIdAndDelete(id);

    if (!chapterGroup) {
      return {
        success: false,
        statusCode: 404,
        message: 'Chapter Group not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Chapter Group deleted successfully',
      data: chapterGroup,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while deleting chapter group',
      error: error?.message || error,
    };
  }
};

const chapterGroupServices = {
  createChapterGroup,
  updateChapterGroup,
  getAllChapterGroups,
  getChapterGroupById,
  getChapterGroupBySlug,
  getChapterGroupsBySubjectId,
  deleteChapterGroup,
};

export default chapterGroupServices;

