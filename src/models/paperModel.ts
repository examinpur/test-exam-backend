import mongoose from 'mongoose';

const paperSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    paperNumber: {
      type: Number,
      default: 1,
    },
    shift: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    boardSlug: {
      type: String,
      required: true,
    },
    examSlug: {
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
    questionPathKeys: {
      type: [String],
      default: [],
    },
    questionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'papers',
  },
);

paperSchema.index({ examId: 1, slug: 1 }, { unique: true });
paperSchema.index({ examId: 1, year: -1 });

export default mongoose.model('Paper', paperSchema);

