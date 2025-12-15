import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
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

