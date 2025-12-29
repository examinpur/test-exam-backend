import mongoose from 'mongoose';
import { imageSchema } from './questionModel';

const i18nStringSchema = new mongoose.Schema(
  {
    en: { type: String, required: true },
    hi: { type: String },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    name: { type: i18nStringSchema, required: true },
    image: { type: imageSchema, default: null },
    slug: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    boardSlug: {
      type: String,
      required: true,
    },
    pathSlugs: {
      type: [String],
      required: true,
    },
    pathKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'exams',
  },
);

examSchema.index({ boardId: 1, slug: 1 }, { unique: true });
examSchema.index({ boardSlug: 1 });

export default mongoose.model('Exam', examSchema);

