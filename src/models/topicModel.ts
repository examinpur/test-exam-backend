import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
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
    chapterGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChapterGroup',
      required: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
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
    examSlug: {
      type: String,
      required: true,
    },
    subjectSlug: {
      type: String,
      required: true,
    },
    chapterGroupSlug: {
      type: String,
      required: true,
    },
    chapterSlug: {
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
    collection: 'topics',
  },
);

topicSchema.index({ chapterId: 1, slug: 1 }, { unique: true });
topicSchema.index({ chapterSlug: 1, chapterGroupSlug: 1, subjectSlug: 1, examSlug: 1 });

export default mongoose.model('Topic', topicSchema);

