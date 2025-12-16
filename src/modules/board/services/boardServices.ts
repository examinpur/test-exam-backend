import Board from '../../../models/boardModel';
import { generateSlug } from '../../../utils/slug';
import { BoardResponse } from '../types/boardTypes';

const createBoard = async (name: string): Promise<BoardResponse> => {
  try {
    const slug = generateSlug(name);

    // Check if board with same slug already exists
    const existingBoard = await Board.findOne({ slug });
    if (existingBoard) {
      return {
        success: false,
        statusCode: 400,
        message: 'Board with this name already exists',
      };
    }

    // Get the current max order to assign next order
    const maxOrderBoard = await Board.findOne().sort({ order: -1 });
    const nextOrder = maxOrderBoard ? (maxOrderBoard.order || 0) + 1 : 0;

    const board = await Board.create({
      name,
      slug,
      order: nextOrder,
      isActive: true,
    });

    return {
      success: true,
      statusCode: 201,
      message: 'Board created successfully',
      data: board,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while creating board',
      error: error?.message || error,
    };
  }
};

const updateBoard = async (id: string, name: string): Promise<BoardResponse> => {
  try {
    const board = await Board.findById(id);
    if (!board) {
      return {
        success: false,
        statusCode: 404,
        message: 'Board not found',
      };
    }

    const slug = generateSlug(name);

    // Check if another board with same slug exists
    const existingBoard = await Board.findOne({ slug, _id: { $ne: id } });
    if (existingBoard) {
      return {
        success: false,
        statusCode: 400,
        message: 'Board with this name already exists',
      };
    }

    const updatedBoard = await Board.findByIdAndUpdate(
      id,
      {
        name,
        slug,
      },
      { new: true },
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Board updated successfully',
      data: updatedBoard,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while updating board',
      error: error?.message || error,
    };
  }
};

const getAllBoards = async (): Promise<BoardResponse> => {
  try {
    const boards = await Board.find().sort({ order: 1 });

    return {
      success: true,
      statusCode: 200,
      message: 'Boards fetched successfully',
      data: boards,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching boards',
      error: error?.message || error,
    };
  }
};

const getBoardById = async (id: string): Promise<BoardResponse> => {
  try {
    const board = await Board.findById(id);

    if (!board) {
      return {
        success: false,
        statusCode: 404,
        message: 'Board not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Board fetched successfully',
      data: board,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching board',
      error: error?.message || error,
    };
  }
};

const getBoardBySlug = async (slug: string): Promise<BoardResponse> => {
  try {
    const board = await Board.findOne({ slug });

    if (!board) {
      return {
        success: false,
        statusCode: 404,
        message: 'Board not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Board fetched successfully',
      data: board,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching board',
      error: error?.message || error,
    };
  }
};

const deleteBoard = async (id: string): Promise<BoardResponse> => {
  try {
    const board = await Board.findByIdAndDelete(id);

    if (!board) {
      return {
        success: false,
        statusCode: 404,
        message: 'Board not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Board deleted successfully',
      data: board,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while deleting board',
      error: error?.message || error,
    };
  }
};

const boardServices = {
  createBoard,
  updateBoard,
  getAllBoards,
  getBoardById,
  getBoardBySlug,
  deleteBoard,
};

export default boardServices;

