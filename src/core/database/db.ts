import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDB(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('pos_offline.db');
    // Enable WAL mode for better performance
    _db.execSync('PRAGMA journal_mode = WAL;');
    _db.execSync('PRAGMA foreign_keys = ON;');
  }
  return _db;
}

export async function initializeDatabase(): Promise<void> {
  const db = getDB();
  runMigrations(db);
}

export function closeDatabase(): void {
  if (_db) {
    _db.closeSync();
    _db = null;
  }
}
