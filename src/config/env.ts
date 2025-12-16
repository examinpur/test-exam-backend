import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 8000,
  environment: process.env.ENVIRONMENT || 'Development',
  appUrl: process.env.APP_URL || 'http://localhost:8000',

  db: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017',
    name: process.env.MONGO_DB_NAME || 'paper',
  },

  jwt: {
    salt: process.env.SALT_ROUNDS || 1,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    secret: process.env.JWT_SECRET || 'your_top_secret_key_to_encrypt_your_jwt_token',
  },

  logLevel: process.env.LOG_LEVEL || 'Development',
}
