import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// ВИПРАВЛЕНО: Додано всі ролі з БД
export enum UserRole {
  Admin = 'Admin',
  Librarian = 'Librarian',
  Reader = 'Reader',
  Accountant = 'Accountant',
}

@Entity('users') // ВИПРАВЛЕНО
export class User {
  @PrimaryGeneratedColumn({ name: 'userid' }) // ВИПРАВЛЕНО
  id: number;

  @Column({ name: 'fullname' }) // ВИПРАВЛЕНО
  fullName: string;

  @Column({ name: 'contactinfo' }) // ВИПРАВЛЕНО
  contactInfo: string;

	@Column({ name: 'password_hash', nullable: true })
	password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    name: 'role', // ВИПРАВЛЕНО
  })
  role: UserRole;

  @Column({ name: 'violationcount' }) // ВИПРАВЛЕНО
  violationCount: number;

  @Column({ name: 'isblocked' }) // ВИПРАВЛЕНО
  isBlocked: boolean;

  @Column({ name: 'dateofbirth', type: 'date' }) // ВИПРАВЛЕНО
  dateOfBirth: Date;
}
