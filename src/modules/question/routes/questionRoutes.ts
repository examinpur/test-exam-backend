import { Router } from 'express';
import questionController from '../controller/questionController';

const router = Router();

router.post(
  '/',
  questionController.createQuestion,
);

router.put(
  '/:id',
  questionController.updateQuestion,
);

router.get(
  '/',
  questionController.getQuestions,
);

router.get(
  '/:id',
  questionController.getQuestion,
);

router.delete(
  '/:id',
  questionController.deleteQuestion,
);

export default router;

