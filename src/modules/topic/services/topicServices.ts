import Topic from '../../../models/topicModel';
import Chapter from '../../../models/chapterModel';
import Subject from '../../../models/subjectModel';
import { generateSlug } from '../../../utils/slug';
import { TopicResponse } from '../types/topicTypes';

const createTopic = async (
  boardId: string,
  examId: string,
  subjectId: string,
  chapterId: string,
  name: string,
): Promise<TopicResponse> => {
  try {
    // Validate chapter exists and get subject/exam/board info
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return {
        success: false,
        statusCode: 404,
        message: 'Chapter not found',
      };
    }

    // Verify chapter belongs to the subject, exam, and board
    if (chapter.subjectId.toString() !== subjectId) {
      return {
        success: false,
        statusCode: 400,
        message: 'Chapter does not belong to the specified subject',
      };
    }

    if (chapter.examId.toString() !== examId) {
      return {
        success: false,
        statusCode: 400,
        message: 'Chapter does not belong to the specified exam',
      };
    }

    if (chapter.boardId.toString() !== boardId) {
      return {
        success: false,
        statusCode: 400,
        message: 'Chapter does not belong to the specified board',
      };
    }

    const topicSlug = generateSlug(name);
    const boardSlug = chapter.boardSlug;
    const examSlug = chapter.examSlug;
    const subjectSlug = chapter.subjectSlug;
    const chapterSlug = chapter.slug;

    // Check if topic with same slug already exists for this chapter
    const existingTopic = await Topic.findOne({ chapterId, slug: topicSlug });
    if (existingTopic) {
      return {
        success: false,
        statusCode: 400,
        message: 'Topic with this name already exists for this chapter',
      };
    }

    // Create pathSlugs and pathKey
    const pathSlugs = [boardSlug, examSlug, subjectSlug, chapterSlug, topicSlug];
    const pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterSlug}/${topicSlug}`;

    // Get the current max order for this chapter
    const maxOrderTopic = await Topic.findOne({ chapterId }).sort({ order: -1 });
    const nextOrder = maxOrderTopic ? (maxOrderTopic.order || 0) + 1 : 0;

    const topic = await Topic.create({
      boardId,
      examId,
      subjectId,
      chapterId,
      name,
      slug: topicSlug,
      order: nextOrder,
      isActive: true,
      boardSlug,
      examSlug,
      subjectSlug,
      chapterSlug,
      pathSlugs,
      pathKey,
    });

    return {
      success: true,
      statusCode: 201,
      message: 'Topic created successfully',
      data: topic,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while creating topic',
      error: error?.message || error,
    };
  }
};

const updateTopic = async (
  id: string,
  boardId: string | undefined,
  examId: string | undefined,
  subjectId: string | undefined,
  chapterId: string | undefined,
  name: string | undefined,
): Promise<TopicResponse> => {
  try {
    const topic = await Topic.findById(id);
    if (!topic) {
      return {
        success: false,
        statusCode: 404,
        message: 'Topic not found',
      };
    }

    let updateData: any = {};
    let newBoardId = topic.boardId.toString();
    let newExamId = topic.examId.toString();
    let newSubjectId = topic.subjectId.toString();
    let newChapterId = topic.chapterId.toString();
    let newName = topic.name;

    // If chapterId is provided, validate it exists
    if (chapterId) {
      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        return {
          success: false,
          statusCode: 404,
          message: 'Chapter not found',
        };
      }

      // Verify relationships
      if (subjectId && chapter.subjectId.toString() !== subjectId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Chapter does not belong to the specified subject',
        };
      }

      if (examId && chapter.examId.toString() !== examId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Chapter does not belong to the specified exam',
        };
      }

      if (boardId && chapter.boardId.toString() !== boardId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Chapter does not belong to the specified board',
        };
      }

      newChapterId = chapterId;
      newSubjectId = chapter.subjectId.toString();
      newExamId = chapter.examId.toString();
      newBoardId = chapter.boardId.toString();
      updateData.chapterId = chapterId;
      updateData.subjectId = chapter.subjectId;
      updateData.examId = chapter.examId;
      updateData.boardId = chapter.boardId;
      updateData.chapterSlug = chapter.slug;
      updateData.subjectSlug = chapter.subjectSlug;
      updateData.examSlug = chapter.examSlug;
      updateData.boardSlug = chapter.boardSlug;
    } else if (subjectId || examId || boardId) {
      // If only subjectId/examId/boardId is provided, get current chapter
      const chapter = await Chapter.findById(topic.chapterId);
      if (chapter) {
        if (subjectId && chapter.subjectId.toString() !== subjectId) {
          return {
            success: false,
            statusCode: 400,
            message: 'Current chapter does not belong to the specified subject',
          };
        }
        if (examId && chapter.examId.toString() !== examId) {
          return {
            success: false,
            statusCode: 400,
            message: 'Current chapter does not belong to the specified exam',
          };
        }
        if (boardId && chapter.boardId.toString() !== boardId) {
          return {
            success: false,
            statusCode: 400,
            message: 'Current chapter does not belong to the specified board',
          };
        }
      }
    }

    // If name is provided, update slug and path fields
    if (name) {
      newName = name;
      const topicSlug = generateSlug(name);
      const chapter = await Chapter.findById(newChapterId);
      if (!chapter) {
        return {
          success: false,
          statusCode: 404,
          message: 'Chapter not found',
        };
      }

      const boardSlug = updateData.boardSlug || chapter.boardSlug;
      const examSlug = updateData.examSlug || chapter.examSlug;
      const subjectSlug = updateData.subjectSlug || chapter.subjectSlug;
      const chapterSlug = updateData.chapterSlug || chapter.slug;

      // Check if another topic with same slug exists for this chapter
      const existingTopic = await Topic.findOne({
        chapterId: newChapterId,
        slug: topicSlug,
        _id: { $ne: id },
      });
      if (existingTopic) {
        return {
          success: false,
          statusCode: 400,
          message: 'Topic with this name already exists for this chapter',
        };
      }

      updateData.name = name;
      updateData.slug = topicSlug;
      updateData.pathSlugs = [boardSlug, examSlug, subjectSlug, chapterSlug, topicSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterSlug}/${topicSlug}`;
    } else if (chapterId || subjectId || examId || boardId) {
      // If only chapterId/subjectId/examId/boardId is updated, we need to update path fields with existing slug
      const chapter = await Chapter.findById(newChapterId);
      if (!chapter) {
        return {
          success: false,
          statusCode: 404,
          message: 'Chapter not found',
        };
      }

      const topicSlug = topic.slug;
      const boardSlug = updateData.boardSlug || chapter.boardSlug;
      const examSlug = updateData.examSlug || chapter.examSlug;
      const subjectSlug = updateData.subjectSlug || chapter.subjectSlug;
      const chapterSlug = updateData.chapterSlug || chapter.slug;
      updateData.pathSlugs = [boardSlug, examSlug, subjectSlug, chapterSlug, topicSlug];
      updateData.pathKey = `${boardSlug}/${examSlug}/${subjectSlug}/${chapterSlug}/${topicSlug}`;
    }

    const updatedTopic = await Topic.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Topic updated successfully',
      data: updatedTopic,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while updating topic',
      error: error?.message || error,
    };
  }
};

const getAllTopics = async (): Promise<TopicResponse> => {
  try {
    const topics = await Topic.find().sort({ order: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Topics fetched successfully',
      data: topics,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching topics',
      error: error?.message || error,
    };
  }
};

const getTopicById = async (id: string): Promise<TopicResponse> => {
  try {
    const topic = await Topic.findById(id);

    if (!topic) {
      return {
        success: false,
        statusCode: 404,
        message: 'Topic not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Topic fetched successfully',
      data: topic,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching topic',
      error: error?.message || error,
    };
  }
};

const getTopicBySlug = async (slug: string): Promise<TopicResponse> => {
  try {
    const topic = await Topic.findOne({ slug });

    if (!topic) {
      return {
        success: false,
        statusCode: 404,
        message: 'Topic not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Topic fetched successfully',
      data: topic,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching topic',
      error: error?.message || error,
    };
  }
};

const getTopicsByChapterId = async (chapterId: string): Promise<TopicResponse> => {
  try {
    const topics = await Topic.find({ chapterId }).sort({ order: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Topics fetched successfully',
      data: topics,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching topics',
      error: error?.message || error,
    };
  }
};

const deleteTopic = async (id: string): Promise<TopicResponse> => {
  try {
    const topic = await Topic.findByIdAndDelete(id);

    if (!topic) {
      return {
        success: false,
        statusCode: 404,
        message: 'Topic not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Topic deleted successfully',
      data: topic,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while deleting topic',
      error: error?.message || error,
    };
  }
};

const topicServices = {
  createTopic,
  updateTopic,
  getAllTopics,
  getTopicById,
  getTopicBySlug,
  getTopicsByChapterId,
  deleteTopic,
};

export default topicServices;
