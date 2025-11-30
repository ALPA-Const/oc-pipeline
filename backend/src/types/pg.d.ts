declare module 'pg' {
  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    connectionTimeoutMillis?: number;
    ssl?: boolean | { rejectUnauthorized: boolean };
  }

  export interface QueryResult<T = any> {
    rows: T[];
    rowCount: number | null;
    command: string;
    oid: number;
    fields: any[];
  }

  export interface PoolClient {
    query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    release(err?: Error): void;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'connect' | 'acquire' | 'remove', listener: (client: PoolClient) => void): this;
  }

  const pg: {
    Pool: typeof Pool;
  };

  export default pg;
}
