import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

// Type definitions for pg query results
interface QueryResult<T = any> {
  rows: T[];
  rowCount: number | null;
  command: string;
  oid: number;
  fields: any[];
}

dotenv.config();

export const dbConfig = {
  url: process.env.DATABASE_URL,
  poolSize: 10,
  connectionTimeout: 30000,
};

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: dbConfig.poolSize,
  connectionTimeoutMillis: dbConfig.connectionTimeout,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Log pool errors
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Execute a SQL query
 * @param text - SQL query string
 * @param params - Query parameters
 * @returns Query result
 */
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Database query error:', { text: text.substring(0, 50), error });
    throw error;
  }
}

/**
 * Test database connection
 * @returns true if connection successful, false otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
  return pool.connect();
}

export { pool };
export default pool;