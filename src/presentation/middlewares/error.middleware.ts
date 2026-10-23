import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
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

    // Errores conocidos de Prisma → respuestas 4xx descriptivas
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return res.status(400).json({ error: 'A record with this value already exists' });
        case 'P2003':
          return res.status(400).json({ error: 'Related record does not exist' });
        case 'P2025':
          return res.status(404).json({ error: 'Record not found' });
      }
    }

    // Body JSON mal formado (express.json)
    if ((error as { type?: string })?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    console.error('Unhandled Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  };
}
