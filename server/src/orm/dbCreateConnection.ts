import { createConnection } from 'typeorm';
import config = require('./config/ormconfig');

export const dbCreateConnection = () => createConnection(config);
