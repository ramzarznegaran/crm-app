import { D1Database, Contact } from './types';

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export async function findUserByEmail(db: D1Database, email: string) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?').bind(email);
  return await stmt.first();
}

export async function findContactByPhone(db: D1Database, orgId: string, phoneNumber: string): Promise<Contact | null> {
  const stmt = db.prepare(
    'SELECT * FROM contacts WHERE org_id = ? AND phone_number = ?'
  ).bind(orgId, phoneNumber);
  return await stmt.first<Contact>();
}
