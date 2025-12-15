import Chapter from '../../../models/chapterModel';
import Subject from '../../../models/subjectModel';
import Exam from '../../../models/examModel';
import { generateSlug } from '../../../utils/slug';
import { ChapterResponse } from '../types/chapterTypes';

const createChapter = async (
  boardId: string,
  examId: string,
  subjectId: string,
  name: string,
): Promise<ChapterResponse> => {
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

    const chapterSlug = generateSlug(name);
    const boardSlug = subject.boardSlug;
    const examSlug = subject.examSlug;
    const subjectSlug = subject.slug;

    // Check if chapter with same slug already exists for this subject
    const existingChapter = await Chapter.findOne({ subjectId, slug: chapterSlug });
    if (existingChapter) {
      return {
        success: false,
        statusCode: 400,
        message: 'Chapter with this name already exists for this subject',
      };
    }

    // Create pathSlugs and pathKey
    const pathSlugs = [boardSlug, examSlug, subjectSlug, chapterSlug];
    const pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterSlug}`;

    // Get the current max order for this subject
    const maxOrderChapter = await Chapter.findOne({ subjectId }).sort({ order: -1 });
    const nextOrder = maxOrderChapter ? (maxOrderChapter.order || 0) + 1 : 0;

    const chapter = await Chapter.create({
      boardId,
      examId,
      subjectId,
      name,
      slug: chapterSlug,
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
      message: 'Chapter created successfully',
      data: chapter,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while creating chapter',
      error: error?.message || error,
    };
  }
};

const updateChapter = async (
  id: string,
  boardId: string | undefined,
  examId: string | undefined,
  subjectId: string | undefined,
  name: string | undefined,
): Promise<ChapterResponse> => {
  try {
    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return {
        success: false,
        statusCode: 404,
        message: 'Chapter not found',
      };
    }

    let updateData: any = {};
    let newBoardId = chapter.boardId.toString();
    let newExamId = chapter.examId.toString();
    let newSubjectId = chapter.subjectId.toString();
    let newName = chapter.name;

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
      const subject = await Subject.findById(chapter.subjectId);
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
      const chapterSlug = generateSlug(name);
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

      // Check if another chapter with same slug exists for this subject
      const existingChapter = await Chapter.findOne({
        subjectId: newSubjectId,
        slug: chapterSlug,
        _id: { $ne: id },
      });
      if (existingChapter) {
        return {
          success: false,
          statusCode: 400,
          message: 'Chapter with this name already exists for this subject',
        };
      }

      updateData.name = name;
      updateData.slug = chapterSlug;
      updateData.pathSlugs = [boardSlug, examSlug, subjectSlug, chapterSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterSlug}`;
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

      const chapterSlug = chapter.slug;
      const boardSlug = updateData.boardSlug || subject.boardSlug;
      const examSlug = updateData.examSlug || subject.examSlug;
      const subjectSlug = updateData.subjectSlug || subject.slug;
      updateData.pathSlugs = [boardSlug, examSlug, subjectSlug, chapterSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterSlug}`;
    }

    const updatedChapter = await Chapter.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Chapter updated successfully',
      data: updatedChapter,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while updating chapter',
      error: error?.message || error,
    };
  }
};

const getAllChapters = async (): Promise<ChapterResponse> => {
  try {
    const chapters = await Chapter.find().sort({ order: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Chapters fetched successfully',
      data: chapters,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching chapters',
      error: error?.message || error,
    };
  }
};

const getChapterById = async (id: string): Promise<ChapterResponse> => {
  try {
    const chapter = await Chapter.findById(id);

    if (!chapter) {
      return {
        success: false,
        statusCode: 404,
        message: 'Chapter not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Chapter fetched successfully',
      data: chapter,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching chapter',
      error: error?.message || error,
    };
  }
};

const getChapterBySlug = async (slug: string): Promise<ChapterResponse> => {
  try {
    const chapter = await Chapter.findOne({ slug });

    if (!chapter) {
      return {
        success: false,
        statusCode: 404,
        message: 'Chapter not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Chapter fetched successfully',
      data: chapter,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching chapter',
      error: error?.message || error,
    };
  }
};

const getChaptersBySubjectId = async (subjectId: string): Promise<ChapterResponse> => {
  try {
    const chapters = await Chapter.find({ subjectId }).sort({ order: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Chapters fetched successfully',
      data: chapters,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching chapters',
      error: error?.message || error,
    };
  }
};

const deleteChapter = async (id: string): Promise<ChapterResponse> => {
  try {
    const chapter = await Chapter.findByIdAndDelete(id);

    if (!chapter) {
      return {
        success: false,
        statusCode: 404,
        message: 'Chapter not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Chapter deleted successfully',
      data: chapter,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while deleting chapter',
      error: error?.message || error,
    };
  }
};

const chapterServices = {
  createChapter,
  updateChapter,
  getAllChapters,
  getChapterById,
  getChapterBySlug,
  getChaptersBySubjectId,
  deleteChapter,
};

export default chapterServices;
