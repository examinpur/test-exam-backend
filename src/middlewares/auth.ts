import {
  Request,
  Response,
  NextFunction,
} from 'express';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const authorization = req.headers;

    if (userId && authorization?.authorization) {
      next();
    } else {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Please provide userId & authorization token',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error occurred while authorizing token',
    });
  }
}
