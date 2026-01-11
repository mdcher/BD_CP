export interface JwtPayload {
  id: number;
  fullName: string;
  contactInfo: string;
  role: 'Admin' | 'Librarian' | 'Reader' | 'Accountant';
}
