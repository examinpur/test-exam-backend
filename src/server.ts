import app from './app';
import env from './config/env';
import logger from './utils/logger';
import http from 'http';

const server = http.createServer(app);

server.listen(env.port, () => {
  logger.info(`Server running on PORT: ${env.port}`);
});
