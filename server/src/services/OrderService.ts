import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

interface OrderItemData {
  pricelistid: number;
  quantity: number;
}

export const OrderService = {
  // Отримати всі замовлення
  getAll: async () => {
    const connection = getConnection();
    const query = `
      SELECT * FROM public.orders
      ORDER BY orderdate DESC;
    `;
    return await connection.query(query);
  },

  // Отримати одне замовлення з деталями
  getOne: async (orderId: number) => {
    const connection = getConnection();

    // Отримати замовлення
    const orderQuery = `SELECT * FROM public.orders WHERE orderid = $1::integer;`;
    const orders = await connection.query(orderQuery, [orderId]);

    if (orders.length === 0) {
      throw new CustomError(404, 'General', `Order with ID ${orderId} not found.`);
    }

    // Отримати позиції замовлення (ВИПРАВЛЕНО: використовуємо price_list)
    const itemsQuery = `
      SELECT
        oi.pricelistid,
        pl.booktitle as title,
        pl.price as unitprice,
        oi.quantity,
        (oi.quantity * pl.price) as subtotal
      FROM public.order_items oi
      JOIN public.price_list pl ON oi.pricelistid = pl.pricelistid
      WHERE oi.orderid = $1::integer;
    `;
    const items = await connection.query(itemsQuery, [orderId]);

    return {
      ...orders[0],
      items,
    };
  },

  // Створити нове замовлення (використовуємо процедуру БД)
  create: async (supplier: string, items: OrderItemData[]) => {
    const connection = getConnection();
    try {
      // Конвертуємо items в JSONB формат
      const itemsJson = JSON.stringify(items);

      // Викликаємо процедуру create_custom_order з БД
      await connection.query(
        'CALL public.create_custom_order($1::varchar, $2::jsonb)',
        [supplier, itemsJson]
      );

      // Знаходимо щойно створене замовлення
      const latestOrderQuery = `
        SELECT * FROM public.orders
        WHERE supplier = $1::varchar
        ORDER BY orderid DESC
        LIMIT 1;
      `;
      const orders = await connection.query(latestOrderQuery, [supplier]);

      if (orders.length === 0) {
        throw new CustomError(404, 'General', 'Failed to retrieve created order.');
      }

      return await OrderService.getOne(orders[0].orderid);
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Order creation failed', [err.message]);
    }
  },

  // Оновити статус замовлення
  updateStatus: async (orderId: number, status: 'Created' | 'InProgress' | 'Completed' | 'Cancelled') => {
    const connection = getConnection();
    const query = `
      UPDATE public.orders
      SET status = $1::varchar
      WHERE orderid = $2::integer
      RETURNING *;
    `;
    const result = await connection.query(query, [status, orderId]);

    if (result[0].length === 0) {
      throw new CustomError(404, 'General', `Order with ID ${orderId} not found.`);
    }

    return result[0];
  },

  // Автоматичне створення замовлення на популярні книги
  autoOrder: async (supplier: string, threshold: number = 0.5, quantity: number = 5) => {
    const connection = getConnection();

    try {
      // Викликаємо процедуру з БД
      await connection.query(
        `CALL public.proc_autoorderbooks($1::varchar, $2::float, $3::integer)`,
        [supplier, threshold, quantity]
      );

      // Знаходимо щойно створене замовлення
      const latestOrderQuery = `
        SELECT * FROM public.orders
        WHERE supplier = $1::varchar
        ORDER BY orderid DESC
        LIMIT 1;
      `;
      const orders = await connection.query(latestOrderQuery, [supplier]);

      if (orders.length === 0) {
        throw new CustomError(404, 'General', 'No books matched the threshold for auto-ordering.');
      }

      return await OrderService.getOne(orders[0].orderid);
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Auto-order failed.', [err.message]);
    }
  },

  // Створити замовлення на вибрані книги (НОВЕ: для замовлення нових книг)
  createCustomOrder: async (supplier: string, items: { pricelistid: number; quantity: number }[]) => {
    const connection = getConnection();

    try {
      // Конвертуємо items в JSONB формат
      const itemsJson = JSON.stringify(items);

      // Викликаємо процедуру з БД
      await connection.query(
        `CALL public.create_custom_order($1::varchar, $2::jsonb)`,
        [supplier, itemsJson]
      );

      // Знаходимо щойно створене замовлення
      const latestOrderQuery = `
        SELECT * FROM public.orders
        WHERE supplier = $1::varchar
        ORDER BY orderid DESC
        LIMIT 1;
      `;
      const orders = await connection.query(latestOrderQuery, [supplier]);

      if (orders.length === 0) {
        throw new CustomError(404, 'General', 'Failed to create custom order.');
      }

      return await OrderService.getOne(orders[0].orderid);
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Custom order creation failed.', [err.message]);
    }
  },

  // Отримати прайс-лист (ВИПРАВЛЕНО: використовуємо price_list)
  getPriceList: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM public.price_list ORDER BY booktitle;`;
    return await connection.query(query);
  },

  // Додати книгу до прайс-листу (ВИПРАВЛЕНО: використовуємо price_list)
  addToPriceList: async (data: {
    booktitle: string;
    price: number;
  }) => {
    const connection = getConnection();
    const query = `
      INSERT INTO public.price_list (booktitle, price)
      VALUES ($1::varchar, $2::numeric)
      RETURNING *;
    `;
    try {
      const result = await connection.query(query, [
        data.booktitle,
        data.price,
      ]);
      return result[0];
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Failed to add book to price list.', [err.message]);
    }
  },
};
