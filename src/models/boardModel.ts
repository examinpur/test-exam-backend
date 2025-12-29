import mongoose from "mongoose";
import { imageSchema } from "./questionModel";

const i18nStringSchema = new mongoose.Schema(
  {
    en: { type: String, required: true },
    hi: { type: String },
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: i18nStringSchema,
      required: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    image: {
      type: imageSchema,
      default: null,
    },

    order: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "boards",
  }
);

export default mongoose.model("Board", boardSchema);
