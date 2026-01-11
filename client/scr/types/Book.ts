export interface Book {
  bookid: number;
  title: string;
  publisher: string;
  language: string;
  year: number;
  location: string;
  physicalstatus: 'New' | 'Good' | 'Damaged' | 'Lost';
  availabilitystatus: 'Available' | 'Loaned' | 'Reserved' | 'Unavailable';
  authors: string; // Кома розділений список авторів
  genres: string; // Кома розділений список жанрів
}
