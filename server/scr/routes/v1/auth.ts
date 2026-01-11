import { Router } from 'express';
import { login } from '../../controllers/auth/login';
import { register } from '../../controllers/auth/register';

const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/register', register);

export default authRouter;