import { Router } from 'express';
import chapterController from '../controller/chapterController';

const router = Router();

router.post(
  '/',
  chapterController.createChapter,
);

router.put(
  '/:id',
  chapterController.updateChapter,
);

router.get(
  '/',
  chapterController.getChapters,
);

router.get(
  '/:id',
  chapterController.getChapter,
);

router.delete(
  '/:id',
  chapterController.deleteChapter,
);

export default router;
