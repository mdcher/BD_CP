export interface Book {
    bookid: number;
    title: string;
    authors: string; // View повертає це як строку "Orwell, Rowling"
    genres: string;
    status: 'New' | 'Good' | 'Damaged' | 'Lost';
    availabilitystatus: 'Available' | 'Loaned' | 'Reserved' | 'Unavailable'; // Ключове поле!
}

export interface HistoryItem {
    eventdate: string;
    eventtype: 'Loan' | 'Fine';
    description: string;
    status: string;
    amount: string;
}

export interface User {
    userid: number;
    username: string; // fullname
    role: 'Reader' | 'Librarian' | 'Admin';
}