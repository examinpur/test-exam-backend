import mongoose from 'mongoose';


const i18nStringSchema = new mongoose.Schema(
  {
    en: { type: String, required: true },
    hi: { type: String },
  },
  { _id: false }
);

const chapterGroupSchema = new mongoose.Schema(
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    name: { type: i18nStringSchema, required: true },
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
    examSlug: {
      type: String,
      required: true,
    },
    subjectSlug: {
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
    collection: 'chapterGroups',
  },
);

chapterGroupSchema.index({ subjectId: 1, slug: 1 }, { unique: true });
chapterGroupSchema.index({ subjectSlug: 1, examSlug: 1 });

export default mongoose.model('ChapterGroup', chapterGroupSchema);

