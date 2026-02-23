import { customAlphabet } from 'nanoid/non-secure';
import { getDB } from './db';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

function now(): string {
  return new Date().toISOString();
}

export function insert<T extends Record<string, unknown>>(
  table: string,
  data: Partial<T>
): string {
  const db = getDB();
  const id = data.id as string ?? nanoid();
  const record: Record<string, unknown> = {
    ...data,
    id,
    created_at: data.created_at ?? now(),
  };

  const keys = Object.keys(record);
  const placeholders = keys.map(() => '?').join(', ');
  const values = keys.map((k) => record[k]);

  db.runSync(
    `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
    values as SQLiteBindValue[]
  );

  return id;
}

export function update<T extends Record<string, unknown>>(
  table: string,
  id: string,
  data: Partial<T>
): void {
  const db = getDB();
  const record: Record<string, unknown> = { ...data, updated_at: now() };
  const keys = Object.keys(record);
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = [...keys.map((k) => record[k]), id];

  db.runSync(
    `UPDATE ${table} SET ${setClause} WHERE id = ?`,
    values as SQLiteBindValue[]
  );
}

export function softDelete(table: string, id: string): void {
  const db = getDB();
  db.runSync(`UPDATE ${table} SET is_active = 0, updated_at = ? WHERE id = ?`, [now(), id]);
}

export function hardDelete(table: string, id: string): void {
  const db = getDB();
  db.runSync(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

export function findById<T>(table: string, id: string): T | null {
  const db = getDB();
  const result = db.getFirstSync<T>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return result ?? null;
}

export interface FindAllOptions {
  where?: Record<string, unknown>;
  orderBy?: string;
  limit?: number;
  offset?: number;
  search?: { columns: string[]; term: string };
}

export function findAll<T>(table: string, options: FindAllOptions = {}): T[] {
  const db = getDB();
  const conditions: string[] = [];
  const values: SQLiteBindValue[] = [];

  if (options.where) {
    for (const [key, val] of Object.entries(options.where)) {
      if (val === null) {
        conditions.push(`${key} IS NULL`);
      } else {
        conditions.push(`${key} = ?`);
        values.push(val as SQLiteBindValue);
      }
    }
  }

  if (options.search && options.search.term) {
    const searchConditions = options.search.columns.map((col) => `${col} LIKE ?`);
    conditions.push(`(${searchConditions.join(' OR ')})`);
    const term = `%${options.search.term}%`;
    options.search.columns.forEach(() => values.push(term));
  }

  let sql = `SELECT * FROM ${table}`;
  if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
  if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
  if (options.limit) sql += ` LIMIT ${options.limit}`;
  if (options.offset) sql += ` OFFSET ${options.offset}`;

  return db.getAllSync<T>(sql, values);
}

export function runQuery<T>(sql: string, params: SQLiteBindValue[] = []): T[] {
  const db = getDB();
  return db.getAllSync<T>(sql, params);
}

export function getMeta(key: string): string | null {
  const db = getDB();
  const result = db.getFirstSync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', [key]);
  return result?.value ?? null;
}

export function setMeta(key: string, value: string): void {
  const db = getDB();
  db.runSync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [key, value]);
}

type SQLiteBindValue = string | number | null | boolean;
