import { Router } from 'express';
import authRouter from './auth';
import userRouter from './user';
import bookRouter from './books';
import loanRouter from './loans';
import reservationRouter from './reservations';
import fineRouter from './fines';
import reportRouter from './reports';
import employeeRouter from './employees';
import authorRouter from './authors';
import genreRouter from './genres';
import orderRouter from './orders';

const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/users', userRouter);
v1Router.use('/books', bookRouter);
v1Router.use('/authors', authorRouter);
v1Router.use('/genres', genreRouter);
v1Router.use('/loans', loanRouter);
v1Router.use('/reservations', reservationRouter);
v1Router.use('/fines', fineRouter);
v1Router.use('/reports', reportRouter);
v1Router.use('/employees', employeeRouter);
v1Router.use('/orders', orderRouter);

export default v1Router;