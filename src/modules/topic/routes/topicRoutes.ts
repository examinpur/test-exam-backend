import { Router } from 'express';
import topicController from '../controller/topicController';

const router = Router();

router.post(
  '/',
  topicController.createTopic,
);

router.put(
  '/:id',
  topicController.updateTopic,
);

router.get(
  '/',
  topicController.getTopics,
);

router.get(
  '/:id',
  topicController.getTopic,
);

router.delete(
  '/:id',
  topicController.deleteTopic,
);

export default router;
