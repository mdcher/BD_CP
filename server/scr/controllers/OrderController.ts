import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';

export const OrderController = {
  // Отримати всі замовлення
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await OrderService.getAll();
      res.customSuccess(200, 'All orders.', orders);
    } catch (err) {
      next(err);
    }
  },

  // Отримати одне замовлення
  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = Number(req.params.id);
      const order = await OrderService.getOne(orderId);
      res.customSuccess(200, 'Order details.', order);
    } catch (err) {
      next(err);
    }
  },

  // Створити замовлення
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { supplier, items } = req.body;
      const newOrder = await OrderService.create(supplier, items);
      res.customSuccess(201, 'Order created successfully.', newOrder);
    } catch (err) {
      next(err);
    }
  },

  // Оновити статус замовлення
  updateStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = Number(req.params.id);
      const { status } = req.body;
      const updatedOrder = await OrderService.updateStatus(orderId, status);
      res.customSuccess(200, 'Order status updated.', updatedOrder);
    } catch (err) {
      next(err);
    }
  },

  // Автоматичне замовлення
  autoOrder: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { supplier, threshold, quantity } = req.body;
      const order = await OrderService.autoOrder(supplier, threshold, quantity);
      res.customSuccess(201, 'Auto-order created successfully.', order);
    } catch (err) {
      next(err);
    }
  },

  // Отримати прайс-лист
  getPriceList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const priceList = await OrderService.getPriceList();
      res.customSuccess(200, 'Price list.', priceList);
    } catch (err) {
      next(err);
    }
  },

  // Додати книгу до прайс-листу
  addToPriceList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookData = req.body;
      const newBook = await OrderService.addToPriceList(bookData);
      res.customSuccess(201, 'Book added to price list.', newBook);
    } catch (err) {
      next(err);
    }
  },
};
