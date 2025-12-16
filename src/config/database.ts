import ENV from './env';
import mongoose from 'mongoose';
import logger from '../utils/logger';

const dbConnection = async () => {
  try {
    const connection = await mongoose.connect(
      ENV.db.url,
      { dbName: ENV.db.name },
    );

    if (connection) {
      logger.info('Connected with MongoDB Database!!!');
    }
  } catch (error: any) {
    logger.error(`Error occurred while connecting with MongoDB Database: ${error?.message || error?.response?.error?.message || error?.response?.error || error?.error || error}`);
  }
}

export default dbConnection;
