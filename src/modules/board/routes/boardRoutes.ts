import { Router } from 'express';
import boardController from '../controller/boardController';

const router = Router();

router.post(
  '/',
  boardController.createBoard,
);

router.put(
  '/:id',
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

