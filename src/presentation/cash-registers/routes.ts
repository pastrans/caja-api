import { Router } from 'express';
import { CashRegistersController } from './controller';
import {
  CashRegisterRecordDatasourceImpl,
  CashRegisterRecordRepositoryImpl,
} from '../../infrastructure';

export class CashRegisterRoutes {
  static get routes(): Router {
    const router = Router();

    const datasource = new CashRegisterRecordDatasourceImpl();
    const repository = new CashRegisterRecordRepositoryImpl(datasource);
    const controller = new CashRegistersController(repository);

    // Rutas principales de la caja
    router.post('/open', controller.openCashRegister);
    router.post('/close', controller.closeCashRegister);
    router.get('/active', controller.getActiveCashRegister);
    router.get('/', controller.getCashRegisters);
    router.get('/:id', controller.getCashRegisterById);

    // Movimientos dentro de la caja activa
    router.post('/transactions', controller.createTransaction);
    router.post('/cash-in-out', controller.createCashInOut);

    return router;
  }
}