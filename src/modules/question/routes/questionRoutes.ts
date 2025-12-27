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
  questionFileUpload.fields([
    { name: 'questions', maxCount: 1 },
    { name: 'images', maxCount: 1 },
  ]),
  questionController.bulkCreateQuestion,
);

router.post(
  '/import-dataset',
  questionFileUpload.single('file'),
  questionController.importQuestionsFromDataset,
);

router.post(
  '/import-markdown',
  questionFileUpload.single('file'),
  questionController.importQuestionsFromMarkdownFile,
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

