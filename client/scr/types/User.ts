export interface User {
  userid: number;
  fullname: string;
  role: 'Admin' | 'Librarian' | 'Reader' | 'Accountant';
  dateofbirth: string;
  contactinfo: string;
  violationcount: number;
  isblocked: boolean;
}
