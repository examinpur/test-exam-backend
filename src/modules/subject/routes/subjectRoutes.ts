import { Router } from 'express';
import subjectController from '../controller/subjectController';

const router = Router();

router.post(
  '/',
  subjectController.createSubject,
);

router.put(
  '/:id',
  subjectController.updateSubject,
);

router.get(
  '/',
  subjectController.getSubjects,
);

router.get(
  '/:id',
  subjectController.getSubject,
);

router.delete(
  '/:id',
  subjectController.deleteSubject,
);

export default router;
