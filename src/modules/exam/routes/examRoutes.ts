import { Router } from 'express';
import examController from '../controller/examController';

const router = Router();

router.post(
  '/',
  examController.createExam,
);

router.put(
  '/:id',
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

router.delete(
  '/:id',
  examController.deleteExam,
);

export default router;

