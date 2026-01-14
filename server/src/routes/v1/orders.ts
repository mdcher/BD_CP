import { Router } from 'express';
import { OrderController } from '../../controllers/OrderController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { setDatabaseRole } from '../../middleware/setDatabaseRole';
import { UserRole } from '../../orm/entities/User';

const orderRouter = Router();

// ВАЖЛИВО: Застосовуємо setDatabaseRole для RLS політик
orderRouter.use(setDatabaseRole);

// Отримати прайс-лист (доступно для персоналу)
orderRouter.get(
  '/price-list',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  OrderController.getPriceList
);

// Додати книгу до прайс-листу (тільки для адміна)
orderRouter.post(
  '/price-list',
  [checkJwt, checkRole([UserRole.Admin])],
  OrderController.addToPriceList
);

// Автоматичне замовлення популярних книг
orderRouter.post(
  '/auto-order',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  OrderController.autoOrder
);

// Альяс для auto-order (для зворотної сумісності)
orderRouter.post(
  '/auto',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  OrderController.autoOrder
);

// Отримати всі замовлення
orderRouter.get(
  '/',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin, 'Accountant' as UserRole])],
  OrderController.getAll
);

// Отримати одне замовлення
orderRouter.get(
  '/:id',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin, 'Accountant' as UserRole])],
  OrderController.getOne
);

// Створити замовлення
orderRouter.post(
  '/',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  OrderController.create
);

// Оновити статус замовлення
orderRouter.put(
  '/:id/status',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  OrderController.updateStatus
);

export default orderRouter;
