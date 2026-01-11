import $api from '../api/axios';
import { Book } from '../types/Book';
import { HistoryItem } from '../types/HistoryItem';
import { AUTH, BOOKS, LOANS, RESERVATIONS, FINES, USERS, REPORTS } from '../api/endpoints'; // ДОДАНО

export const LibraryService = {
    // --- Книги ---
    getAllBooks: async () => {
        return $api.get<Book[]>(BOOKS.BASE);
    },
    getOneBook: async (id: number) => {
      return $api.get<Book>(BOOKS.BY_ID(id));
    },
    createBook: async (bookData: any) => {
      return $api.post(BOOKS.CREATE, bookData);
    },
    updateBook: async (id: number, bookData: any) => {
      return $api.put(BOOKS.UPDATE(id), bookData);
    },

    // --- Видачі/Позики ---
    issueBook: async (userId: number, bookId: number, days: number = 14) => {
        return $api.post(LOANS.ISSUE, { userId, bookId, days });
    },
    returnBook: async (loanId: number) => {
        return $api.post(LOANS.RETURN(loanId));
    },
    getMyHistory: async () => {
        return $api.get<HistoryItem[]>(LOANS.MY_HISTORY);
    },

    // --- Бронювання ---
    createReservation: async (bookId: number, userId: number) => {
      return $api.post(RESERVATIONS.CREATE, { bookId, userId });
    },
    getMyReservations: async () => {
      return $api.get(RESERVATIONS.MY);
    },
    cancelReservation: async (id: number) => {
      return $api.delete(RESERVATIONS.CANCEL(id));
    },

    // --- Штрафи ---
    getMyUnpaidFines: async () => {
      return $api.get(FINES.MY_UNPAID);
    },
    payFine: async (id: number) => {
      return $api.post(FINES.PAY(id));
    },

    // --- Користувачі (Адміністрування) ---
    getAllUsers: async () => {
      return $api.get(USERS.BASE);
    },
    blockUser: async (id: number) => {
      return $api.put(USERS.BLOCK(id));
    },
    unblockUser: async (id: number) => {
      return $api.put(USERS.UNBLOCK(id));
    },

    // --- Звіти ---
    getDebtorsReport: async () => {
      return $api.get(REPORTS.DEBTORS);
    },
    getFinancialSummaryReport: async () => {
      return $api.get(REPORTS.FINANCIAL_SUMMARY);
    },
    getAuthorRatingsReport: async () => {
      return $api.get(REPORTS.AUTHOR_RATINGS);
    },
    getGenrePopularityReport: async () => {
      return $api.get(REPORTS.GENRE_POPULARITY);
    },

    // --- Авторизація (викликається в AuthContext) ---
    login: async (contactInfo: string, password: string) => {
      return $api.post(AUTH.LOGIN, { contactInfo, password });
    },
    register: async (fullName: string, contactInfo: string, password: string, dateOfBirth: string, role?: string) => {
      return $api.post(AUTH.REGISTER, { fullName, contactInfo, password, dateOfBirth, role });
    },
};