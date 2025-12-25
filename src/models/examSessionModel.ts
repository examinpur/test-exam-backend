import mongoose from 'mongoose';
import { Schema } from 'mongoose';

/*********************************
 * Embedded / small types
 *********************************/

const QuestionResponseSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    chosenIdentifiers: { type: [String], default: [] },
    freeTextAnswer: { type: String },
    marksAwarded: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 }, // ms
    order: { type: Number, required: true },
    flagged: { type: Boolean, default: false },
    meta: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

/*********************************
 * Test / Paper definition
 *********************************/

const ExamTestSchema = new Schema(
  {
    testId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    examKey: { type: String, index: true },
    syllabus: { type: String },
    totalQuestions: { type: Number, default: 0 },
    marks: { type: Number, default: 0 },
    maxNegMarks: { type: Number, default: 0 },
    timeAllotted: { type: Number, default: 0 }, // ms
    layout: { type: String },
    allowRandomize: { type: Boolean, default: true },
    questionPool: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    languages: { type: [String], default: ['en'] },
    isPremium: { type: Boolean, default: false },
    maxAttempt: { type: Number, default: 1 },
    percentileId: { type: String },
  },
  { timestamps: true, collection: 'exam_tests' }
);

/*********************************
 * User Exam Session
 *********************************/

const ExamSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    testId: { type: String, required: true, index: true },
    seriesId: { type: String },

    questionOrder: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    randomSeed: { type: String },

    responses: { type: [QuestionResponseSchema], default: [] },

    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    negativeMarks: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },

    timeSpent: { type: Number, default: 0 },
    subjectStats: { type: Schema.Types.Mixed, default: {} },

    startedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },

    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'evaluated', 'cancelled'],
      default: 'in_progress',
      index: true,
    },

    attemptNumber: { type: Number, default: 1 },

    ip: { type: String },
    device: { type: String },
    platform: { type: String },

    isAnalysisVisible: { type: Boolean, default: false },
    evaluationSnapshot: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'exam_sessions' }
);

ExamSessionSchema.index({ userId: 1, status: 1 });

/*********************************
 * Analytics Snapshot (optional)
 *********************************/

const TestAnalyticsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testId: { type: String, required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'ExamSession', required: true },

    totalMarks: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },

    subjectBreakdown: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'test_analytics' }
);

/*********************************
 * Evaluation Helper (server-side)
 *********************************/

export async function evaluateResponses(session: any, questionDocs: any[]) {
  const qMap = new Map();
  for (const q of questionDocs) qMap.set(String(q._id), q);

  let totalMarks = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  const subjectStats: any = {};

  for (const resp of session.responses) {
    const q = qMap.get(String(resp.questionId));

    let marksAwarded = 0;
    let isCorrect = false;

    if (!q) {
      skipped++;
    } else if ((resp.chosenIdentifiers && resp.chosenIdentifiers.length) || resp.freeTextAnswer) {
      if (['MCQ', 'MSQ', 'TRUE_FALSE'].includes(q.kind)) {
        const correctIds = (q.correct && q.correct.identifiers) || [];
        const given = (resp.chosenIdentifiers || []).slice().sort();
        const expected = correctIds.slice().sort();

        if (JSON.stringify(given) === JSON.stringify(expected)) {
          marksAwarded = q.marks || 0;
          isCorrect = true;
        } else {
          marksAwarded = -(q.negMarks || 0);
        }
      } else if (['INTEGER', 'FILL_BLANK'].includes(q.kind)) {
        if (q.correct && typeof q.correct.integer !== 'undefined') {
          if (Number(resp.freeTextAnswer) === Number(q.correct.integer)) {
            marksAwarded = q.marks || 0;
            isCorrect = true;
          } else {
            marksAwarded = -(q.negMarks || 0);
          }
        }
      }
    } else {
      skipped++;
    }

    resp.marksAwarded = marksAwarded;
    resp.isCorrect = isCorrect;

    totalMarks += marksAwarded;
    if (isCorrect) correct++;
    else if (marksAwarded < 0) wrong++;

    if (q && q.subjectId) {
      const sid = String(q.subjectId);
      subjectStats[sid] = subjectStats[sid] || { marks: 0, correct: 0, wrong: 0, skipped: 0 };
      subjectStats[sid].marks += marksAwarded;
      if (isCorrect) subjectStats[sid].correct++;
      else if (marksAwarded < 0) subjectStats[sid].wrong++;
      else subjectStats[sid].skipped++;
    }
  }

  const totalQuestions = session.questionOrder.length || 0;
  const accuracy = totalQuestions ? (correct / totalQuestions) * 100 : 0;

  return {
    totalMarks,
    correct,
    wrong,
    skipped,
    accuracy,
    subjectStats,
    evaluatedAt: new Date(),
  };
}

export const ExamTest = mongoose.model('ExamTest', ExamTestSchema);
export const ExamSession = mongoose.model('ExamSession', ExamSessionSchema);
export const TestAnalytics = mongoose.model('TestAnalytics', TestAnalyticsSchema);
export { QuestionResponseSchema };


