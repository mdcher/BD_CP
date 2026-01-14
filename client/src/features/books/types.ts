export enum LanguageEnum {
	UKRAINIAN = "Українська",
	ENGLISH = "Англійська",
	GERMAN = "Німецька",
	FRENCH = "Французька",
	SPANISH = "Іспанська",
	ROMANIAN = "Румунська",
	SLOVAK = "Словацька",
}

export enum BookStatus {
	NEW = "New",
	GOOD = "Good",
	DAMAGED = "Damaged",
	LOST = "Lost",
}

// Loan type for loanHistory in Book
export interface Loan {
	id: number;
	issueDate: string;
	dueDate: string;
	isReturned: boolean;
	returnDate: string | null;
	userId: number;
}

// Backend BookResponseDto
export interface Book {
	bookid: number;
	title: string;
	authors: string;
	genres: string;
	publisher: string;
	language: string;
	location: string;
	year: number;
	status: string;
	availabilitystatus: string;
	loanHistory: Loan[];
}

// Backend CreateBookDto
export interface CreateBookDto {
	title: string;
	publisher: string;
	language: LanguageEnum;
	year: number;
	location: string;
	status: BookStatus;
	authorIds: number[];
	genreIds: number[];
}

export type UpdateBookDto = Partial<CreateBookDto>;
