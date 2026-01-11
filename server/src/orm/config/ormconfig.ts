import { ConnectionOptions } from 'typeorm';
import { User } from '../entities/User';
import { Book } from '../entities/Book';
import { Loan } from '../entities/Loan';
import { Fine } from '../entities/Fine';

const config: ConnectionOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    logging: false,
    entities: [User, Book, Loan, Fine],
    migrations: [],
    subscribers: [],
};

export = config;