// Loan types synced with backend LoanResponseDto and CreateLoanDto

export interface Loan {
	id: number;
	issueDate: string; // YYYY-MM-DD
	dueDate: string; // YYYY-MM-DD
	isReturned: boolean;
	returnDate: string | null;
	userId: number;
	book?: {
		id: number;
		title: string;
		status: string;
	};
}

export interface CreateLoanDto {
	issueDate: string; // DateString YYYY-MM-DD
	dueDate: string;
	isReturned?: boolean; // Optional, default false
	returnDate?: string; // Optional
	userId: number;
	bookId: number;
}

export type UpdateLoanDto = Partial<CreateLoanDto>;
