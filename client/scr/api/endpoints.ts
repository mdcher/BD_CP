// Авторизація
export const AUTH = {
  LOGIN: 'auth/login',
  REGISTER: 'auth/register',
};

// Книги
export const BOOKS = {
  BASE: 'books',
  BY_ID: (id: number) => `books/${id}`,
  CREATE: 'books',
  UPDATE: (id: number) => `books/${id}`,
};

// Видачі/Позики
export const LOANS = {
  BASE: 'loans',
  ISSUE: 'loans',
  RETURN: (id: number) => `loans/${id}/return`,
  MY_HISTORY: 'loans/my-history',
};

// Бронювання
export const RESERVATIONS = {
  BASE: 'reservations',
  CREATE: 'reservations',
  MY: 'reservations/my',
  CANCEL: (id: number) => `reservations/${id}`,
};

// Штрафи
export const FINES = {
  BASE: 'fines',
  MY_UNPAID: 'fines/my-unpaid',
  PAY: (id: number) => `fines/${id}/pay`,
};

// Користувачі (Адміністрування)
export const USERS = {
  BASE: 'users',
  BLOCK: (id: number) => `users/${id}/block`,
  UNBLOCK: (id: number) => `users/${id}/unblock`,
};

// Звіти
export const REPORTS = {
  BASE: 'reports',
  DEBTORS: 'reports/debtors',
  FINANCIAL_SUMMARY: 'reports/financial-summary',
  AUTHOR_RATINGS: 'reports/author-ratings',
  GENRE_POPULARITY: 'reports/genre-popularity',
};
