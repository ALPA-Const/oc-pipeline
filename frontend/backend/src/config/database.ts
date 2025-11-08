import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
  url: process.env.DATABASE_URL,
  poolSize: 10,
  connectionTimeout: 30000,
};

export default dbConfig;