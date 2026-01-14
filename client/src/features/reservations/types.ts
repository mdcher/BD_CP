export interface Reservation {
	reservationid: number;
	userid: number;
	bookid: number;
	book_title: string;
	reservationdate: string;
	pickupdate: string | null;
	iscompleted: boolean;
	isconfirmed: boolean;
	status: string;
	librarianid: number | null;
	user_name?: string;
	contactinfo?: string;
	book_status?: string;
	days_waiting?: number;
	availability_status?: string;
}
