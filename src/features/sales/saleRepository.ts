import { customAlphabet } from 'nanoid/non-secure';
import { getDB } from '../../core/database/db';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

const now = () => new Date().toISOString();

export interface Sale {
  id: string;
  invoice_number: string;
  contact_id: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  paid_amount: number;
  payment_method: 'cash' | 'card' | 'bank' | 'split';
  status: 'completed' | 'voided' | 'refunded';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  barcode: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  line_total: number;
  created_at: string;
}

function generateInvoiceNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `INV-${y}${m}${d}-${seq}`;
}

export function createSale(data: {
  contact_id?: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  paid_amount: number;
  payment_method: 'cash' | 'card' | 'bank' | 'split';
  items: Array<{
    product_id: string;
    product_name: string;
    barcode?: string | null;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    tax_percent: number;
    line_total: number;
  }>;
  notes?: string;
}): string {
  const db = getDB();
  const saleId = nanoid();
  const invoiceNumber = generateInvoiceNumber();
  const timestamp = now();

  db.runSync('BEGIN TRANSACTION');

  try {
    db.runSync(
      `INSERT INTO sales (id, invoice_number, contact_id, subtotal, tax_amount, discount_amount, total, paid_amount, payment_method, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)`,
      [
        saleId,
        invoiceNumber,
        data.contact_id ?? null,
        data.subtotal,
        data.tax_amount,
        data.discount_amount,
        data.total,
        data.paid_amount,
        data.payment_method,
        data.notes ?? null,
        timestamp,
        timestamp,
      ]
    );

    for (const item of data.items) {
      const itemId = nanoid();
      db.runSync(
        `INSERT INTO sale_items (id, sale_id, product_id, product_name, barcode, quantity, unit_price, discount_percent, tax_percent, line_total, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          saleId,
          item.product_id,
          item.product_name,
          item.barcode ?? null,
          item.quantity,
          item.unit_price,
          item.discount_percent,
          item.tax_percent,
          item.line_total,
          timestamp,
        ]
      );

      db.runSync(
        `UPDATE products SET stock = stock - ? WHERE id = ?`,
        [item.quantity, item.product_id]
      );

      db.runSync(
        `INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_at)
         VALUES (?, ?, 'WH001', 'sale', ?, 'sale', ?, 'Sale: ' || ?, ?)`,
        [nanoid(), -item.quantity, saleId, invoiceNumber, timestamp]
      );
    }

    db.runSync('COMMIT');
    return saleId;
  } catch (error) {
    db.runSync('ROLLBACK');
    throw error;
  }
}

export function getAllSales(): Sale[] {
  const db = getDB();
  return db.getAllSync<Sale>('SELECT * FROM sales ORDER BY created_at DESC');
}

export function getSaleById(id: string): Sale | null {
  const db = getDB();
  return db.getFirstSync<Sale>('SELECT * FROM sales WHERE id = ?', [id]) ?? null;
}

export function getSaleItems(saleId: string): SaleItem[] {
  const db = getDB();
  return db.getAllSync<SaleItem>('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);
}

export function voidSale(saleId: string, reason: string): void {
  const db = getDB();
  const timestamp = now();

  db.runSync('BEGIN TRANSACTION');

  try {
    const items = db.getAllSync<{ product_id: string; quantity: number }>(
      'SELECT product_id, quantity FROM sale_items WHERE sale_id = ?',
      [saleId]
    );

    for (const item of items) {
      db.runSync('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      db.runSync(
        `INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_at)
         VALUES (?, ?, 'WH001', 'sale_return', ?, 'sale', ?, 'Void: ' || ?, ?)`,
        [nanoid(), item.quantity, saleId, reason, timestamp]
      );
    }

    db.runSync("UPDATE sales SET status = 'voided', notes = notes || ? WHERE id = ?", [`\nVoid reason: ${reason}`, saleId]);

    db.runSync('COMMIT');
  } catch (error) {
    db.runSync('ROLLBACK');
    throw error;
  }
}

export function getSalesByDateRange(startDate: string, endDate: string): Sale[] {
  const db = getDB();
  return db.getAllSync<Sale>(
    'SELECT * FROM sales WHERE created_at >= ? AND created_at <= ? AND status = ? ORDER BY created_at DESC',
    [startDate, endDate, 'completed']
  );
}

export function getSalesSummary(): { totalSales: number; totalRevenue: number; totalTax: number; count: number } {
  const db = getDB();
  const result = db.getFirstSync<{ totalSales: string; totalRevenue: string; totalTax: string; count: string }>(
    "SELECT COALESCE(SUM(total), 0) as totalSales, COALESCE(SUM(subtotal), 0) as totalRevenue, COALESCE(SUM(tax_amount), 0) as totalTax, COUNT(*) as count FROM sales WHERE status = 'completed'"
  );
  return {
    totalSales: Number(result?.totalSales ?? 0),
    totalRevenue: Number(result?.totalRevenue ?? 0),
    totalTax: Number(result?.totalTax ?? 0),
    count: Number(result?.count ?? 0),
  };
}
