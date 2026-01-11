import { Router } from 'express';
import { issue, returnBook, myHistory } from '../../controllers/LoanController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { UserRole } from '../../orm/entities/User';

const loanRouter = Router();

// Видати книгу (доступ: Бібліотекар, Адмін)
loanRouter.post('/', [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])], issue);

// Повернути книгу (доступ: Бібліотекар, Адмін)
loanRouter.post('/:id/return', [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])], returnBook);

// Моя історія (доступ: Будь-який авторизований юзер)
loanRouter.get('/my-history', [checkJwt], myHistory);

export default loanRouter;