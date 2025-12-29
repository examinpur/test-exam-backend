import Board from "../../../models/boardModel";
import { uploading } from "../../../utils/cloudinaryUpload";
import { generateSlug } from "../../../utils/slug";
import { uploadImageBuffer } from "../../question/helper/cloudinaryHelper";
import { BoardResponse, I18nString } from "../types/boardTypes";
import fs from "fs/promises";

const createBoard = async (
  name: I18nString,
  file?: Express.Multer.File
): Promise<BoardResponse> => {
  try {
    const slug = generateSlug(name.en);

    const existingBoard = await Board.findOne({ slug });
    if (existingBoard) {
      return {
        success: false,
        statusCode: 400,
        message: "Board with this name already exists",
      };
    }

    const maxOrderBoard = await Board.findOne().sort({ order: -1 });
    const nextOrder = maxOrderBoard ? (maxOrderBoard.order || 0) + 1 : 0;

    let image: any | null = await uploading(file);


    const board = await Board.create({
      name, 
      slug,
      order: nextOrder,
      isActive: true,
      image: image ?? null,
    });

    return {
      success: true,
      statusCode: 201,
      message: "Board created successfully",
      data: board,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Error occurred while creating board",
      error: error?.message || error,
    };
  }
};

const updateBoard = async (
  id: string,
  updates: {
    name?: I18nString;
    order?: number;
    isActive?: boolean;
    image?: any | null;
  },
  file?: Express.Multer.File
): Promise<BoardResponse> => {
  try {
    const board = await Board.findById(id);
    if (!board) {
      return { success: false, statusCode: 404, message: "Board not found" };
    }
    const updatePayload: any = {};

    if (updates.name) {
      const slug = generateSlug(updates?.name?.en);
      updatePayload.name = updates.name;
      updatePayload.slug = slug;
    }

    if (typeof updates.order === "number") updatePayload.order = updates.order;
    if (typeof updates.isActive === "boolean") updatePayload.isActive = updates.isActive;
    
    let image: any | null = await uploading(file);
    updatePayload.image = image ?? null;
    const updatedBoard = await Board.findByIdAndUpdate(id, updatePayload, { new: true });

    return {
      success: true,
      statusCode: 200,
      message: "Board updated successfully",
      data: updatedBoard,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Error occurred while updating board",
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
      message: "Boards fetched successfully",
      data: boards,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Error occurred while fetching boards",
      error: error?.message || error,
    };
  }
};

const getBoardById = async (id: string): Promise<BoardResponse> => {
  try {
    const board = await Board.findById(id);
    if (!board) {
      return { success: false, statusCode: 404, message: "Board not found" };
    }
    return {
      success: true,
      statusCode: 200,
      message: "Board fetched successfully",
      data: board,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Error occurred while fetching board",
      error: error?.message || error,
    };
  }
};

const getBoardBySlug = async (slug: string): Promise<BoardResponse> => {
  try {
    const board = await Board.findOne({ slug });
    if (!board) {
      return { success: false, statusCode: 404, message: "Board not found" };
    }
    return {
      success: true,
      statusCode: 200,
      message: "Board fetched successfully",
      data: board,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Error occurred while fetching board",
      error: error?.message || error,
    };
  }
};

const deleteBoard = async (id: string): Promise<BoardResponse> => {
  try {
    const board = await Board.findByIdAndDelete(id);
    if (!board) {
      return { success: false, statusCode: 404, message: "Board not found" };
    }
    return {
      success: true,
      statusCode: 200,
      message: "Board deleted successfully",
      data: board,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: "Error occurred while deleting board",
      error: error?.message || error,
    };
  }
};

export default {
  createBoard,
  updateBoard,
  getAllBoards,
  getBoardById,
  getBoardBySlug,
  deleteBoard,
};


