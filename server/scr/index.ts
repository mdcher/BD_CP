import dotenv from 'dotenv';
import path from 'path';
// Завантажуємо змінні середовища ДО всього іншого
dotenv.config({ path: path.resolve(__dirname, '../config/.env') });

import 'reflect-metadata';
import fs from 'fs';

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import './utils/response/customSuccess';
import { errorHandler } from './middleware/errorHandler';
import { getLanguage } from './middleware/getLanguage';
import { dbCreateConnection } from './orm/dbCreateConnection';
import routes from './routes';

export const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Дозволяємо запити з фронтенду
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(getLanguage);

try {
    const logDirectory = path.join(__dirname, '../log');
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
    }
    const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), {
        flags: 'a',
    });
    app.use(morgan('combined', { stream: accessLogStream }));
} catch (err) {
    console.log(err);
}
app.use(morgan('combined'));

app.use('/api', routes);

app.use(errorHandler);

const port = process.env.PORT || 4000;

(async () => {
    try {
        console.log('🔌 Connecting to database...');
        await dbCreateConnection();
        console.log('✅ Database connected successfully');

        app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
})();


