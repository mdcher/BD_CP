import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('fines') // ВИПРАВЛЕНО: lowercase
export class Fine {
  @PrimaryGeneratedColumn({ name: 'fineid' }) // ВИПРАВЛЕНО: lowercase
  id: number;

  @Column({ name: 'userid' }) // ВИПРАВЛЕНО: правильний зв'язок з User
  userId: number;

  @Column({ name: 'typeid' }) // ВИПРАВЛЕНО: зв'язок з violation_types
  typeId: number;

  @Column({ name: 'issuedate', type: 'date' }) // ДОДАНО: дата нарахування
  issueDate: Date;

  @Column({ name: 'paiddate', type: 'date', nullable: true }) // ДОДАНО: дата оплати
  paidDate: Date;

  @Column({ name: 'ispaid', default: false }) // ВИПРАВЛЕНО: lowercase
  isPaid: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount' }) // ВИПРАВЛЕНО: lowercase
  amount: number;

  // Зв'язок з користувачем
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userid' })
  user: User;
}
