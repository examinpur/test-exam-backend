import cors from 'cors';
import express from 'express';
import dbConnection from './config/database';
import { errorHandler } from './middlewares/errorHandler';
import boardRoutes from './modules/board/routes/boardRoutes';
import examRoutes from './modules/exam/routes/examRoutes';
import subjectRoutes from './modules/subject/routes/subjectRoutes';
import chapterRoutes from './modules/chapter/routes/chapterRoutes';
import topicRoutes from './modules/topic/routes/topicRoutes';

dbConnection();
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.send('ok');
});

// API v1 Routes
app.use('/api/v1/boards', boardRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/chapters', chapterRoutes);
app.use('/api/v1/topics', topicRoutes);

app.use(errorHandler);

export default app;
