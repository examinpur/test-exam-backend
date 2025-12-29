import { Router } from 'express';
import examController from '../controller/examController';
import upload from '../../../middlewares/upload';

const router = Router();

router.post(
  '/',
  upload.single('file'),
  examController.createExam,
);

router.patch(
  '/:id',
  upload.single('file'),
  examController.updateExam,
);

router.get(
  '/',
  examController.getExams,
);

router.get(
  '/:id',
  examController.getExam,
);

router.get(
  '/by-board/:boardId',
  examController.getExamByBoardId,
);

router.get(
  '/by-slug/:slug',
  examController.getExamBySlug,
);

router.delete(
  '/:id',
  examController.deleteExam,
);

export default router;

