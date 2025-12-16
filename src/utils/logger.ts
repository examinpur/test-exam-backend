import {
  format,
  addColors,
  transports,
  createLogger,
} from 'winston';
import env from '../config/env';

const {
  json,
  align,
  printf,
  errors,
  combine,
  colorize,
  timestamp,
} = format;

const LOG_LEVEL =
  process.env.LOG_LEVEL ||
  (env.environment === 'Development' ? 'debug' : 'info');

const customColors = {
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'green',
  silly: 'grey',
};

addColors(customColors);

const consoleFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? `${JSON.stringify(meta)}` : '';
  return `${timestamp} ${level}: ${stack || message}${metaString}`;
});

const logger = createLogger({
  level: LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new transports.Console({
      level: LOG_LEVEL,
      format:
        env.environment === 'Production'
          ? combine(timestamp(), errors({ stack: true }), json())
          : combine(
              colorize({ all: true }),
              timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              align(),
              errors({ stack: true }),
              consoleFormat
            ),
    }),

    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],

  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }),
  ],
});

(logger as any).stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
