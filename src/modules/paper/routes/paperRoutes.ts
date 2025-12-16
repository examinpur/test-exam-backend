import { Router } from 'express';
import paperController from '../controller/paperController';

const router = Router();

router.post(
  '/',
  paperController.createPaper,
);

router.put(
  '/:id',
  paperController.updatePaper,
);

router.get(
  '/',
  paperController.getPapers,
);

router.get(
  '/:id',
  paperController.getPaper,
);

router.delete(
  '/:id',
  paperController.deletePaper,
);

export default router;

