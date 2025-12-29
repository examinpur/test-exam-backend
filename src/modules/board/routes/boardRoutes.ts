import { Router } from 'express';
import boardController from '../controller/boardController';
import upload from '../../../middlewares/upload';

const router = Router();

router.post(
  '/',
  upload.single('file'),
  boardController.createBoard,
);

router.patch(
  '/:id',
  upload.single('file'),
  boardController.updateBoard,
);

router.get(
  '/',
  boardController.getBoards,
);

router.get(
  '/:id',
  boardController.getBoard,
);

router.delete(
  '/:id',
  boardController.deleteBoard,
);

export default router;

