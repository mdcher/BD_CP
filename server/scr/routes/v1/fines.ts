import { Router } from 'express';
import { FineController } from '../../controllers/FineController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { UserRole } from '../../orm/entities/User';

const fineRouter = Router();

// Маршрут для користувача, щоб побачити свої неоплачені штрафи
fineRouter.get('/my-unpaid', [checkJwt], FineController.getMyUnpaid);

// Маршрут для персоналу (бухгалтер, адмін) для позначки штрафу як оплаченого
fineRouter.post(
  '/:id/pay',
  [checkJwt, checkRole([UserRole.Admin, 'Accountant' as UserRole])], // Додаємо роль Accountant
  FineController.payFine
);

export default fineRouter;
