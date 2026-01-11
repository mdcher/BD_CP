import { Router } from 'express';
import { BookController } from '../../controllers/BookController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { UserRole } from '../../orm/entities/User'; // Використовуємо наш enum з User.ts

const bookRouter = Router();

// Публічний ендпоінт для перегляду всіх книг
bookRouter.get('/', BookController.getAll);

// Публічний ендпоінт для перегляду однієї книги
bookRouter.get('/:id', BookController.getOne);

// Ендпоінт для створення книги (тільки для персоналу)
bookRouter.post(
  '/',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  BookController.create
);

// Ендпоінт для оновлення книги (тільки для персоналу)
bookRouter.put(
  '/:id',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  BookController.update
);

export default bookRouter;
