import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../../domain';

export class ErrorMiddleware {
  // Un middleware de error en Express SIEMPRE debe recibir 4 parámetros (error, req, res, next)
  static handleError = (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error('Unhandled Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  };
}