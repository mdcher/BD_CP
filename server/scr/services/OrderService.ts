import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

interface OrderItemData {
  orderbookid: number;
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

    // Отримати позиції замовлення
    const itemsQuery = `
      SELECT
        oi.orderbookid,
        ob.title,
        ob.author,
        ob.genre,
        ob.unitprice,
        oi.quantity,
        (oi.quantity * ob.unitprice) as subtotal
      FROM public.order_items oi
      JOIN public.order_books ob ON oi.orderbookid = ob.orderbookid
      WHERE oi.orderid = $1::integer;
    `;
    const items = await connection.query(itemsQuery, [orderId]);

    return {
      ...orders[0],
      items,
    };
  },

  // Створити нове замовлення
  create: async (supplier: string, items: OrderItemData[]) => {
    const connection = getConnection();

    // Створюємо замовлення
    const createOrderQuery = `
      INSERT INTO public.orders (orderdate, supplier, status, totalcost)
      VALUES (CURRENT_DATE, $1::varchar, 'Created', 0)
      RETURNING orderid;
    `;
    const result = await connection.query(createOrderQuery, [supplier]);
    const orderId = result[0].orderid;

    // Додаємо позиції
    for (const item of items) {
      await connection.query(
        `INSERT INTO public.order_items (orderid, orderbookid, quantity)
         VALUES ($1::integer, $2::integer, $3::integer)`,
        [orderId, item.orderbookid, item.quantity]
      );
    }

    // Повертаємо повне замовлення
    return await OrderService.getOne(orderId);
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

  // Отримати прайс-лист (order_books)
  getPriceList: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM public.order_books ORDER BY title;`;
    return await connection.query(query);
  },

  // Додати книгу до прайс-листу
  addToPriceList: async (data: {
    title: string;
    author: string;
    genre: string;
    language: string;
    publisher: string;
    unitprice: number;
  }) => {
    const connection = getConnection();
    const query = `
      INSERT INTO public.order_books (title, author, genre, language, publisher, unitprice)
      VALUES ($1::varchar, $2::varchar, $3::varchar, $4::public.language_enum, $5::varchar, $6::numeric)
      RETURNING *;
    `;
    try {
      const result = await connection.query(query, [
        data.title,
        data.author,
        data.genre,
        data.language,
        data.publisher,
        data.unitprice,
      ]);
      return result[0];
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Failed to add book to price list.', [err.message]);
    }
  },
};
