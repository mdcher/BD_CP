export interface Fine {
	fineid: number;
	amount: number;
	issuedate: string;
	reason: string;
	ispaid?: boolean;
	paiddate?: string | null;
}
