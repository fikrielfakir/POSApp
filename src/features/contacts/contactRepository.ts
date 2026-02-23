import { customAlphabet } from 'nanoid/non-secure';
import { getDB } from '../../core/database/db';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

const now = () => new Date().toISOString();

export interface Contact {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  contact_type: 'customer' | 'supplier' | 'both';
  tax_number?: string;
  opening_balance: number;
  credit_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function createContact(data: { name: string } & Partial<Contact>): string {
  const db = getDB();
  const id = nanoid();
  const timestamp = now();

  db.runSync(
    `INSERT INTO contacts (id, name, code, phone, email, address, contact_type, tax_number, opening_balance, credit_limit, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      data.name,
      data.code || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.contact_type || 'customer',
      data.tax_number || null,
      data.opening_balance || 0,
      data.credit_limit || 0,
      timestamp,
      timestamp,
    ]
  );

  return id;
}

export function getAllContacts(type?: 'customer' | 'supplier' | 'both'): Contact[] {
  const db = getDB();
  if (type) {
    return db.getAllSync<Contact>(
      'SELECT * FROM contacts WHERE contact_type = ? AND is_active = 1 ORDER BY name',
      [type]
    );
  }
  return db.getAllSync<Contact>('SELECT * FROM contacts WHERE is_active = 1 ORDER BY name');
}

export function getContactById(id: string): Contact | null {
  const db = getDB();
  return db.getFirstSync<Contact>('SELECT * FROM contacts WHERE id = ?', [id]) ?? null;
}

export function updateContact(id: string, data: Partial<Contact>): void {
  const db = getDB();
  const timestamp = now();

  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  fields.push('updated_at = ?');
  values.push(timestamp);
  values.push(id);

  db.runSync(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function deleteContact(id: string): void {
  const db = getDB();
  db.runSync('UPDATE contacts SET is_active = 0, updated_at = ? WHERE id = ?', [now(), id]);
}

export function searchContacts(query: string): Contact[] {
  const db = getDB();
  const term = `%${query}%`;
  return db.getAllSync<Contact>(
    'SELECT * FROM contacts WHERE is_active = 1 AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR code LIKE ?) ORDER BY name LIMIT 50',
    [term, term, term, term]
  );
}
