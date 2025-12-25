import { Router } from 'express';
import examSessionController from '../controller/examSessionController';

const router = Router();

// Exam Test routes
router.post('/tests', examSessionController.createExamTest);
router.get('/tests/:testId', examSessionController.getExamTest);

// Exam Session routes
router.post('/sessions', examSessionController.createExamSession);
router.get('/sessions/:sessionId', examSessionController.getExamSession);
router.put('/sessions/:sessionId', examSessionController.updateExamSession);
router.post('/sessions/:sessionId/submit', examSessionController.submitExamSession);
router.get('/sessions/user/:userId', examSessionController.getUserExamSessions);

export default router;


