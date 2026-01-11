import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// ВИПРАВЛЕНО: Фізичний стан книги (відповідає book_status_enum в БД)
export enum BookStatus {
  New = 'New',
  Good = 'Good',
  Damaged = 'Damaged',
  Lost = 'Lost',
}

// ВИПРАВЛЕНО: Мови (відповідає language_enum в БД)
export enum LanguageEnum {
  Ukrainian = 'Українська',
  English = 'Англійська',
  German = 'Німецька',
  French = 'Французька',
  Spanish = 'Іспанська',
  Romanian = 'Румунська',
  Slovak = 'Словацька',
}

@Entity('books') // ВИПРАВЛЕНО: Назва таблиці 'books' (lowercase)
export class Book {
  @PrimaryGeneratedColumn({ name: 'bookid' }) // ВИПРАВЛЕНО: lowercase
  id: number;

  @Column({ name: 'title' }) // ВИПРАВЛЕНО: lowercase
  title: string;

  @Column({ name: 'publisher' }) // ВИПРАВЛЕНО: lowercase
  publisher: string;

  @Column({ name: 'year' }) // ВИПРАВЛЕНО: lowercase
  year: number;

  @Column({
    type: 'enum',
    enum: LanguageEnum,
    name: 'language', // ДОДАНО: Поле language
  })
  language: LanguageEnum;

  @Column({
    type: 'enum',
    enum: BookStatus,
    default: BookStatus.New,
    name: 'status', // ВИПРАВЛЕНО: lowercase, фізичний стан
  })
  status: BookStatus;

  @Column({ name: 'location' }) // ВИПРАВЛЕНО: lowercase
  location: string;
}
