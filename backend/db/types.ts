export interface Organization {
  id: string;
  name: string;
  created_at: number;
}

export interface User {
  id: string;
  org_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'owner' | 'user';
  created_at: number;
}

export interface Contact {
  id: string;
  org_id: string;
  name: string;
  phone_number: string;
  created_by_user_id: string;
  created_at: number;
  updated_at: number;
}

export interface Call {
  id: string;
  org_id: string;
  contact_id: string | null;
  user_id: string;
  phone_number: string;
  direction: 'incoming' | 'outgoing';
  start_time: number;
  duration: number;
  created_at: number;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}
