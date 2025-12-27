import mongoose from 'mongoose';


export const imageSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true },   
    version:  { type: Number, required: true },   

    width:  { type: Number, required: true },
    height: { type: Number, required: true },

    alt: { type: String, default: "" },
  },
  { _id: false }
);

const optionSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
  },
  { _id: false },
);

const localizedBlockSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    options: {
      type: [optionSchema],
      default: [],
    },
    explanation: {
      type: String,
    },
    explanationImages: {
      type: [imageSchema],
      default: [],
    },
  },
  { _id: false },
);

const i18nSchema = new mongoose.Schema(
  {
    en: {
      type: localizedBlockSchema,
      required: true,
    },
    hi: {
      type: localizedBlockSchema,
    },
  },
  { _id: false },
);

const correctSchema = new mongoose.Schema(
  {
    identifiers: {
      type: [String],
      default: [],
    },
    integer: {
      type: Number,
    },
    fills: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
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
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
    },
    paperRefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper',
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
    topicSlug: {
      type: String,
    },
    comprehensionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
    comprehensionOrder: {
      type: Number,
      default: 0,
    },
    slug: {
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
    kind: {
      type: String,
      enum: ['MCQ', 'MSQ', 'TRUE_FALSE', 'INTEGER', 'FILL_BLANK', 'COMPREHENSION_PASSAGE'],
      required: true,
      index: true,
    },
    marks: {
      type: Number,
      default: 4,
    },
    negMarks: {
      type: Number,
      default: 1,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
      index: true,
    },
    calculator: {
      type: Boolean,
      default: false,
    },
    passage: {
      type: i18nSchema,
    },
    prompt: {
      type: i18nSchema,
    },
    correct: {
      type: correctSchema,
    },
    year: {
      type: Number,
      index: true,
    },
    paperId: {
      type: String,
      index: true,
    },
    yearKey: {
      type: String,
      index: true,
    },
    section: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'questions',
  },
);

questionSchema.index(
  { comprehensionId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { comprehensionId: { $exists: true } } },
);

questionSchema.index(
  { topicId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: { comprehensionId: { $exists: false }, topicId: { $exists: true } },
  },
);

questionSchema.index(
  { chapterId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: { comprehensionId: { $exists: false }, topicId: { $exists: false } },
  },
);

questionSchema.index({ examId: 1, subjectId: 1, chapterGroupId: 1, chapterId: 1, topicId: 1, kind: 1 });
questionSchema.index({ examId: 1, paperId: 1, year: 1 });

export default mongoose.model('Question', questionSchema);

