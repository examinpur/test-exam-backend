import { Router } from 'express';
import questionController from '../controller/questionController';
import questionFileUpload from '../helper/questionFileUpload';

const router = Router();

router.post(
  '/',
  questionController.createQuestion,
);

router.post(
  '/bulk',
  questionFileUpload.single('file'),
  questionController.bulkCreateQuestion,
);

router.post(
  '/import-dataset',
  questionFileUpload.single('file'),
  questionController.importQuestionsFromDataset,
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

