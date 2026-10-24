import { Router } from 'express';
import multer from 'multer';
import { envs } from '../../config';
import { PurchaseDocumentsController } from './controller';
import {
  PurchaseDocumentDatasourceImpl,
  PurchaseDocumentRepositoryImpl,
  UserDatasourceImpl,
  UserRepositoryImpl,
} from '../../infrastructure';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const MAX_FILES = 100;
const MAX_FILE_SIZE = 1024 * 1024; // 1 MB (un DTE pesa entre 7 y 50 KB)

export class PurchaseDocumentRoutes {
  static get routes(): Router {
    const router = Router();

    const purchaseDocumentRepository = new PurchaseDocumentRepositoryImpl(new PurchaseDocumentDatasourceImpl());
    const controller = new PurchaseDocumentsController(purchaseDocumentRepository, envs.RECEIVER_NRCS);
    const userRepository = new UserRepositoryImpl(new UserDatasourceImpl());

    const requireAdmin = AuthMiddleware.validateJWT(userRepository, 'ADMIN');

    // Los archivos se leen en memoria y no se guardan en disco
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { files: MAX_FILES, fileSize: MAX_FILE_SIZE },
    });

    router.post('/import', requireAdmin, upload.array('files', MAX_FILES), controller.importDocuments);

    return router;
  }
}
