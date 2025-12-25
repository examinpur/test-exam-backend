import mongoose from 'mongoose';
import { ExamTest, ExamSession, TestAnalytics, evaluateResponses } from '../../../models/examSessionModel';
import Question from '../../../models/questionModel';
import { ExamSessionResponse, ExamSessionData, ExamTestData } from '../types/examSessionTypes';

const createExamTest = async (data: ExamTestData): Promise<ExamSessionResponse> => {
  try {
    const existingTest = await ExamTest.findOne({ testId: data.testId });
    if (existingTest) {
      return {
        success: false,
        statusCode: 400,
        message: 'Test with this testId already exists',
      };
    }

    const examTest = await ExamTest.create(data);

    return {
      success: true,
      statusCode: 201,
      message: 'Exam test created successfully',
      data: examTest,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while creating exam test',
      error: error?.message || error,
    };
  }
};

const getExamTest = async (testId: string): Promise<ExamSessionResponse> => {
  try {
    const examTest = await ExamTest.findOne({ testId }).populate('questionPool');
    if (!examTest) {
      return {
        success: false,
        statusCode: 404,
        message: 'Exam test not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Exam test fetched successfully',
      data: examTest,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching exam test',
      error: error?.message || error,
    };
  }
};

const createExamSession = async (data: ExamSessionData): Promise<ExamSessionResponse> => {
  try {
    const examTest = await ExamTest.findOne({ testId: data.testId });
    if (!examTest) {
      return {
        success: false,
        statusCode: 404,
        message: 'Exam test not found',
      };
    }

    // Check for existing in_progress session
    const existingSession = await ExamSession.findOne({
      userId: data.userId,
      testId: data.testId,
      status: 'in_progress',
    });

    if (existingSession) {
      return {
        success: true,
        statusCode: 200,
        message: 'Existing session found',
        data: existingSession,
      };
    }

    // Generate question order
    let questionOrder = data.questionOrder || [];
    if (!questionOrder.length && examTest.questionPool && examTest.questionPool.length > 0) {
      const pool = [...examTest.questionPool];
      if (examTest.allowRandomize) {
        // Simple shuffle
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
      }
      questionOrder = pool;
    }

    const sessionData: any = {
      userId: data.userId,
      testId: data.testId,
      seriesId: data.seriesId,
      questionOrder,
      randomSeed: data.randomSeed || Math.random().toString(36).substring(7),
      responses: [],
      startedAt: new Date(),
      lastSeenAt: new Date(),
      status: 'in_progress',
      attemptNumber: 1,
      ip: data.ip,
      device: data.device,
      platform: data.platform,
    };

    const examSession = await ExamSession.create(sessionData);

    return {
      success: true,
      statusCode: 201,
      message: 'Exam session created successfully',
      data: examSession,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while creating exam session',
      error: error?.message || error,
    };
  }
};

const getExamSession = async (sessionId: string, userId?: string): Promise<ExamSessionResponse> => {
  try {
    const query: any = { _id: sessionId };
    if (userId) {
      query.userId = userId;
    }

    const examSession = await ExamSession.findOne(query)
      .populate('questionOrder')
      .populate('responses.questionId');

    if (!examSession) {
      return {
        success: false,
        statusCode: 404,
        message: 'Exam session not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Exam session fetched successfully',
      data: examSession,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching exam session',
      error: error?.message || error,
    };
  }
};

const getUserExamSessions = async (userId: string, status?: string): Promise<ExamSessionResponse> => {
  try {
    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const sessions = await ExamSession.find(query)
      .sort({ createdAt: -1 })
      .populate('questionOrder')
      .limit(100);

    return {
      success: true,
      statusCode: 200,
      message: 'Exam sessions fetched successfully',
      data: sessions,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while fetching exam sessions',
      error: error?.message || error,
    };
  }
};

const updateExamSession = async (
  sessionId: string,
  userId: string,
  updates: Partial<ExamSessionData>
): Promise<ExamSessionResponse> => {
  try {
    const examSession = await ExamSession.findOne({ _id: sessionId, userId });
    if (!examSession) {
      return {
        success: false,
        statusCode: 404,
        message: 'Exam session not found',
      };
    }

    if (updates.responses) {
      examSession.responses = updates.responses as any;
    }
    if (updates.timeSpent !== undefined) {
      examSession.timeSpent = updates.timeSpent;
    }
    if (updates.lastSeenAt) {
      examSession.lastSeenAt = updates.lastSeenAt;
    } else {
      examSession.lastSeenAt = new Date();
    }
    if (updates.status) {
      examSession.status = updates.status;
      if (updates.status === 'submitted' || updates.status === 'evaluated') {
        examSession.submittedAt = new Date();
      }
    }

    await examSession.save();

    return {
      success: true,
      statusCode: 200,
      message: 'Exam session updated successfully',
      data: examSession,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while updating exam session',
      error: error?.message || error,
    };
  }
};

const submitExamSession = async (sessionId: string, userId: string): Promise<ExamSessionResponse> => {
  try {
    const examSession = await ExamSession.findOne({ _id: sessionId, userId }).populate('questionOrder');
    if (!examSession) {
      return {
        success: false,
        statusCode: 404,
        message: 'Exam session not found',
      };
    }

    if (examSession.status !== 'in_progress') {
      return {
        success: false,
        statusCode: 400,
        message: 'Session is already submitted or evaluated',
      };
    }

    // Get all questions
    const questionIds = examSession.questionOrder.map((q: any) => q._id || q);
    const questions = await Question.find({ _id: { $in: questionIds } });

    // Evaluate responses
    const evaluation = await evaluateResponses(examSession, questions);

    // Update session with evaluation results
    examSession.correctCount = evaluation.correct;
    examSession.wrongCount = evaluation.wrong;
    examSession.skippedCount = evaluation.skipped;
    examSession.totalMarks = evaluation.totalMarks;
    examSession.negativeMarks = Math.abs(Math.min(0, evaluation.totalMarks));
    examSession.accuracy = evaluation.accuracy;
    examSession.subjectStats = evaluation.subjectStats;
    examSession.status = 'evaluated';
    examSession.submittedAt = new Date();
    examSession.evaluationSnapshot = evaluation;
    examSession.isAnalysisVisible = true;

    await examSession.save();

    // Create analytics snapshot
    await TestAnalytics.create({
      userId: examSession.userId,
      testId: examSession.testId,
      sessionId: examSession._id,
      totalMarks: evaluation.totalMarks,
      correct: evaluation.correct,
      wrong: evaluation.wrong,
      skipped: evaluation.skipped,
      accuracy: evaluation.accuracy,
      timeSpent: examSession.timeSpent,
      subjectBreakdown: evaluation.subjectStats,
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Exam session submitted and evaluated successfully',
      data: examSession,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 500,
      message: 'Error occurred while submitting exam session',
      error: error?.message || error,
    };
  }
};

const examSessionServices = {
  createExamTest,
  getExamTest,
  createExamSession,
  getExamSession,
  getUserExamSessions,
  updateExamSession,
  submitExamSession,
};

export default examSessionServices;


