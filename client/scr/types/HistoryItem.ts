export interface HistoryItem {
  userid: number;
  eventdate: string;
  eventtype: 'Loan' | 'Fine';
  description: string;
  status: string;
  amount: number;
}
