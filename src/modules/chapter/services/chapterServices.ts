import Chapter from '../../../models/chapterModel';
import ChapterGroup from '../../../models/chapterGroupModel';
import Subject from '../../../models/subjectModel';
import { generateSlug } from '../../../utils/slug';
import { ChapterResponse } from '../types/chapterTypes';
import { I18nString } from '../../board/types/boardTypes';

type ChapterPathArgs = {
  boardSlug: string;
  examSlug: string;
  subjectSlug: string;
  chapterGroupSlug: string;
  chapterSlug: string;
  onlyActive?: boolean;
};

const createChapter = async (
  boardId: string,
  examId: string,
  subjectId: string,
  chapterGroupId: string,
  name: I18nString,
): Promise<ChapterResponse> => {
  try {

    const chapterGroup = await ChapterGroup.findById(chapterGroupId);
    if (!chapterGroup) {
      return {
        success: false,
        statusCode: 404,
        message: 'Chapter Group not found',
      };
    }

    if (chapterGroup.subjectId.toString() !== subjectId) {
      return {
        success: false,
        statusCode: 400,
        message: 'Chapter Group does not belong to the specified subject',
      };
    }

    if (chapterGroup.examId.toString() !== examId) {
      return {
        success: false,
        statusCode: 400,
        message: 'Chapter Group does not belong to the specified exam',
      };
    }

    if (chapterGroup.boardId.toString() !== boardId) {
      return {
        success: false,
        statusCode: 400,
        message: 'Chapter Group does not belong to the specified board',
      };
    }

    const chapterSlug = generateSlug(name?.en);
    const boardSlug = chapterGroup.boardSlug;
    const examSlug = chapterGroup.examSlug;
    const subjectSlug = chapterGroup.subjectSlug;
    const chapterGroupSlug = chapterGroup.slug;

    const existingChapter = await Chapter.findOne({ chapterGroupId, slug: chapterSlug });
    if (existingChapter) {
      return {
        success: false,
        statusCode: 400,
        message: 'Chapter with this name already exists for this chapter group',
      };
    }

    const pathSlugs = [boardSlug, examSlug, subjectSlug, chapterGroupSlug, chapterSlug];
    const pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterGroupSlug}/${chapterSlug}`;

    const maxOrderChapter = await Chapter.findOne({ chapterGroupId }).sort({ order: -1 });
    const nextOrder = maxOrderChapter ? (maxOrderChapter.order || 0) + 1 : 0;

    const chapter = await Chapter.create({
      boardId,
      examId,
      subjectId,
      chapterGroupId,
      name,
      slug: chapterSlug,
      order: nextOrder,
      isActive: true,
      boardSlug,
      examSlug,
      subjectSlug,
      chapterGroupSlug,
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
  chapterGroupId: string | undefined,
  name: I18nString | undefined,
  order: number | undefined,
  isActive: boolean | undefined
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
    let newChapterGroupId = chapter.chapterGroupId.toString();
    let newName = chapter.name;

    if (chapterGroupId) {
      const chapterGroup = await ChapterGroup.findById(chapterGroupId);
      if (!chapterGroup) {
        return {
          success: false,
          statusCode: 404,
          message: 'Chapter Group not found',
        };
      }

      if (subjectId && chapterGroup.subjectId.toString() !== subjectId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Chapter Group does not belong to the specified subject',
        };
      }

      if (examId && chapterGroup.examId.toString() !== examId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Chapter Group does not belong to the specified exam',
        };
      }

      if (boardId && chapterGroup.boardId.toString() !== boardId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Chapter Group does not belong to the specified board',
        };
      }

      newChapterGroupId = chapterGroupId;
      newSubjectId = chapterGroup.subjectId.toString();
      newExamId = chapterGroup.examId.toString();
      newBoardId = chapterGroup.boardId.toString();
      updateData.chapterGroupId = chapterGroupId;
      updateData.subjectId = chapterGroup.subjectId;
      updateData.examId = chapterGroup.examId;
      updateData.boardId = chapterGroup.boardId;
      updateData.chapterGroupSlug = chapterGroup.slug;
      updateData.subjectSlug = chapterGroup.subjectSlug;
      updateData.examSlug = chapterGroup.examSlug;
      updateData.boardSlug = chapterGroup.boardSlug;
    } else if (subjectId || examId || boardId) {
      const chapterGroup = await ChapterGroup.findById(chapter.chapterGroupId);
      if (chapterGroup) {
        if (subjectId && chapterGroup.subjectId.toString() !== subjectId) {
          return {
            success: false,
            statusCode: 400,
            message: 'Current chapter group does not belong to the specified subject',
          };
        }
        if (examId && chapterGroup.examId.toString() !== examId) {
          return {
            success: false,
            statusCode: 400,
            message: 'Current chapter group does not belong to the specified exam',
          };
        }
        if (boardId && chapterGroup.boardId.toString() !== boardId) {
          return {
            success: false,
            statusCode: 400,
            message: 'Current chapter group does not belong to the specified board',
          };
        }
      }
    }

    if (name) {
      newName = name;
      const chapterSlug = generateSlug(name?.en);
      const chapterGroup = await ChapterGroup.findById(newChapterGroupId);
      if (!chapterGroup) {
        return {
          success: false,
          statusCode: 404,
          message: 'Chapter Group not found',
        };
      }

      const boardSlug = updateData.boardSlug || chapterGroup.boardSlug;
      const examSlug = updateData.examSlug || chapterGroup.examSlug;
      const subjectSlug = updateData.subjectSlug || chapterGroup.subjectSlug;
      const chapterGroupSlug = updateData.chapterGroupSlug || chapterGroup.slug;

      const existingChapter = await Chapter.findOne({
        chapterGroupId: newChapterGroupId,
        slug: chapterSlug,
        _id: { $ne: id },
      });
      if (existingChapter) {
        return {
          success: false,
          statusCode: 400,
          message: 'Chapter with this name already exists for this chapter group',
        };
      }

      updateData.name = name;
      updateData.slug = chapterSlug;
      updateData.pathSlugs = [boardSlug, examSlug, subjectSlug, chapterGroupSlug, chapterSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterGroupSlug}/${chapterSlug}`;
    } else if (chapterGroupId || subjectId || examId || boardId) {
      const chapterGroup = await ChapterGroup.findById(newChapterGroupId);
      if (!chapterGroup) {
        return {
          success: false,
          statusCode: 404,
          message: 'Chapter Group not found',
        };
      }

      const chapterSlug = chapter.slug;
      const boardSlug = updateData.boardSlug || chapterGroup.boardSlug;
      const examSlug = updateData.examSlug || chapterGroup.examSlug;
      const subjectSlug = updateData.subjectSlug || chapterGroup.subjectSlug;
      const chapterGroupSlug = updateData.chapterGroupSlug || chapterGroup.slug;
      updateData.pathSlugs = [boardSlug, examSlug, subjectSlug, chapterGroupSlug, chapterSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterGroupSlug}/${chapterSlug}`;
    }

        if (order !== undefined) {
      updateData.order = order;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
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
    const chapters = await Chapter.find().sort({ order: 1 })
                    .populate('chapterGroupId', 'name order isActive')
                    .populate('boardId', 'name order isActive')
                    .populate('examId', 'name order isActive')
                    .populate('subjectId', 'name order isActive');


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

const getChapterByPath = async (args: ChapterPathArgs): Promise<ChapterResponse> => {
  try {
    const {
      boardSlug,
      examSlug,
      subjectSlug,
      chapterGroupSlug,
      chapterSlug,
      onlyActive = false,
    } = args;
    const pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterGroupSlug}/${chapterSlug}`;
    const chapter = await Chapter.findOne({
      pathKey,
      ...(onlyActive ? { isActive: true } : {}),
    });

    if (!chapter) {
      return {
        success: false,
        statusCode: 404,
        message: "Chapter not found",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Chapter fetched successfully",
      data: chapter,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Error occurred while fetching chapter",
      error: error?.message || error,
    };
  }
};

const getChaptersByChapterGroupId = async (chapterGroupId: string): Promise<ChapterResponse> => {
  try {
    const chapters = await Chapter.find({ chapterGroupId }).sort({ order: 1 });

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
  getChaptersByChapterGroupId,
  deleteChapter,
  getChapterByPath
};

export default chapterServices;
