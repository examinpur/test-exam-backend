import cors from 'cors';
import express from 'express';
import dbConnection from './config/database';
import { errorHandler } from './middlewares/errorHandler';
import boardRoutes from './modules/board/routes/boardRoutes';
import examRoutes from './modules/exam/routes/examRoutes';
import subjectRoutes from './modules/subject/routes/subjectRoutes';
import chapterGroupRoutes from './modules/chapterGroup/routes/chapterGroupRoutes';
import chapterRoutes from './modules/chapter/routes/chapterRoutes';
import topicRoutes from './modules/topic/routes/topicRoutes';
import questionRoutes from './modules/question/routes/questionRoutes';
import paperRoutes from './modules/paper/routes/paperRoutes';

dbConnection();
const app = express();

// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true,
// }));

app.use(cors({
  origin: "*",
  credentials: false,
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.send('ok');
});

app.use('/api/v1/boards', boardRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/chapter-groups', chapterGroupRoutes);
app.use('/api/v1/chapters', chapterRoutes);
app.use('/api/v1/topics', topicRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/papers', paperRoutes);

app.use(errorHandler);

export default app;
