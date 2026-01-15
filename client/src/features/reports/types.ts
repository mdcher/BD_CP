export interface Debtor {
	fullname: string;
	contactinfo: string;
	book_title: string;
	duedate: string;
	days_overdue: number;
}

export interface FinancialSummary {
	totalincomefines: number;
	expensesbooks: number;
	expensessalaries: number;
	netbalance: number;
	reportdate: string;
}

export interface AuthorRating {
	fullname: string;
	total_books: number;
	rank_by_books: number;
}

export interface GenrePopularity {
	title: string;
	genrename: string;
	loan_count: number;
}

export interface ReadingStatistic {
	fullname: string;
	total_loans: number;
	avg_reading_duration: number;
}

export interface TopReader {
	fullname: string;
	contactinfo: string;
	total_books_read: number;
	avg_days_per_book: number;
}