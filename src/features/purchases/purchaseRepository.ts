import { getDB } from '@core/database/db';
import { insert, update as updateRow, findAll, findById } from '@core/database/dbHelpers';
import { Purchase, PurchaseItem } from '@core/database/types';
import { customAlphabet } from 'nanoid/non-secure';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);
const now = () => new Date().toISOString();

export { Purchase, PurchaseItem } from '@core/database/types';

export function getAllPurchases(): Purchase[] {
  const db = getDB();
  return db.getAllSync<Purchase>(
    `SELECT p.*, c.name as contact_name FROM purchases p
     LEFT JOIN contacts c ON p.contact_id = c.id
     ORDER BY p.created_at DESC`
  );
}

export function getPurchaseById(id: string): Purchase | null {
  const db = getDB();
  return db.getFirstSync<Purchase>('SELECT * FROM purchases WHERE id = ?', [id]) ?? null;
}

export function getPurchaseItems(purchaseId: string): PurchaseItem[] {
  const db = getDB();
  return db.getAllSync<PurchaseItem>('SELECT * FROM purchase_items WHERE purchase_id = ?', [purchaseId]);
}

export function createPurchase(data: {
  contact_id?: string | null;
  ref_no?: string | null;
  notes?: string | null;
  items: Array<{ product_id: string; product_name: string; qty: number; cost_price: number }>;
}): string {
  const db = getDB();
  const id = nanoid();
  const timestamp = now();
  const items = data.items;
  const subtotal = items.reduce((s, i) => s + i.qty * i.cost_price, 0);

  db.runSync('BEGIN TRANSACTION');
  try {
    db.runSync(
      `INSERT INTO purchases (id, ref_no, contact_id, subtotal, tax_amt, total, status, notes, created_at)
       VALUES (?, ?, ?, ?, 0, ?, 'ordered', ?, ?)`,
      [id, data.ref_no ?? null, data.contact_id ?? null, subtotal, subtotal, data.notes ?? null, timestamp]
    );
    for (const item of items) {
      db.runSync(
        `INSERT INTO purchase_items (id, purchase_id, product_id, product_name, qty, cost_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nanoid(), id, item.product_id, item.product_name, item.qty, item.cost_price, item.qty * item.cost_price]
      );
    }
    db.runSync('COMMIT');
    return id;
  } catch (e) { db.runSync('ROLLBACK'); throw e; }
}

export function receivePurchase(purchaseId: string): void {
  const db = getDB();
  const timestamp = now();
  const items = getPurchaseItems(purchaseId);
  db.runSync('BEGIN TRANSACTION');
  try {
    for (const item of items) {
      if (!item.product_id) continue;
      db.runSync(`UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?`, [item.qty, item.product_id]);
      db.runSync(
        `INSERT INTO stock_movements (id, product_id, delta, qty_after, reason, created_at)
         SELECT ?, ?, ?, stock_qty, 'Purchase received', ? FROM products WHERE id = ?`,
        [nanoid(), item.product_id, item.qty, timestamp, item.product_id]
      );
    }
    db.runSync(`UPDATE purchases SET status = 'received' WHERE id = ?`, [purchaseId]);
    db.runSync('COMMIT');
  } catch (e) { db.runSync('ROLLBACK'); throw e; }
}
