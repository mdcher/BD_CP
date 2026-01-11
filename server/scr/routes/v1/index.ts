import { Router } from 'express';
import authRouter from './auth';
import userRouter from './user';
import bookRouter from './books';
import loanRouter from './loans';
import reservationRouter from './reservations';
import fineRouter from './fines';
import reportRouter from './reports';

const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/users', userRouter);
v1Router.use('/books', bookRouter);
v1Router.use('/loans', loanRouter);
v1Router.use('/reservations', reservationRouter);
v1Router.use('/fines', fineRouter);
v1Router.use('/reports', reportRouter);

export default v1Router;