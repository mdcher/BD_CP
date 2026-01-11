import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Book } from './Book';

@Entity('loans') // ВИПРАВЛЕНО: lowercase
export class Loan {
  @PrimaryGeneratedColumn({ name: 'loanid' }) // ВИПРАВЛЕНО: lowercase
  id: number;

  @Column({ name: 'bookid' }) // ВИПРАВЛЕНО: lowercase
  bookId: number;

  @Column({ name: 'userid' }) // ВИПРАВЛЕНО: lowercase
  userId: number;

  @Column({ name: 'issuedate', type: 'date' }) // ВИПРАВЛЕНО: lowercase
  issueDate: Date;

  @Column({ name: 'duedate', type: 'date' }) // ВИПРАВЛЕНО: lowercase
  dueDate: Date;

  @Column({ name: 'returndate', type: 'date', nullable: true }) // ВИПРАВЛЕНО: lowercase
  returnDate: Date;

  @Column({ name: 'isreturned', default: false }) // ВИПРАВЛЕНО: lowercase
  isReturned: boolean;

  @Column({ name: 'conditiononreturn', type: 'text', nullable: true }) // ДОДАНО: відсутня колонка
  conditionOnReturn: string;

  // Зв'язки для зручності
  @ManyToOne(() => Book)
  @JoinColumn({ name: 'bookid' })
  book: Book;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userid' })
  user: User;
}
