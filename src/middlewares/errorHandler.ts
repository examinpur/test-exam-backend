import {
  Request,
  Response,
  NextFunction,
} from 'express';
import env from '../config/env';
import logger from '../utils/logger';
import AppError from '../errors/AppError';

type AnyError = Error & { statusCode?: number; meta?: unknown };

export function errorHandler(
  err: AnyError | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const isAppError = err instanceof AppError;

  const statusCode =
    isAppError && (err as AppError).statusCode
      ? (err as AppError).statusCode
      : typeof err.statusCode === 'number' && !Number.isNaN(err.statusCode)
      ? err.statusCode
      : 500;

  const message = err?.message || 'Internal Server Error';
  logger.error('Application Error', {
    message,
    statusCode,
    method: req.method,
    path: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query,
    meta: (err as AnyError).meta,
    stack: err?.stack,
  });

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(env.environment !== 'Production' && { stack: err?.stack }),
  });
}
