import { UserRole as Role } from '../orm/entities/User';

export type JwtPayload = {
  id: number;
  fullName: string;
  contactInfo: string;
  role: Role;
};
