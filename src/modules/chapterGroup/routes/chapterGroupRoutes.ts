import { Router } from 'express';
import chapterGroupController from '../controller/chapterGroupController';

const router = Router();

router.post(
  '/',
  chapterGroupController.createChapterGroup,
);

router.patch(
  '/:id',
  chapterGroupController.updateChapterGroup,
);

router.get(
  '/',
  chapterGroupController.getChapterGroups,
);

router.get(
  '/:id',
  chapterGroupController.getChapterGroup,
);

router.delete(
  '/:id',
  chapterGroupController.deleteChapterGroup,
);

export default router;

