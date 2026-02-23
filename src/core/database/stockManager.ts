import { customAlphabet } from 'nanoid/non-secure';
import { getDB } from './db';
import { findById, runQuery } from './dbHelpers';
import { Product, StockMovement } from './types';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

export function adjustStock(productId: string, delta: number, reason: string): void {
  const db = getDB();
  const product = findById<Product>('products', productId);
  if (!product) return;

  const newQty = Math.max(0, product.stock_qty + delta);
  db.runSync('UPDATE products SET stock_qty = ?, updated_at = ? WHERE id = ?', [
    newQty,
    new Date().toISOString(),
    productId,
  ]);

  // Log movement
  db.runSync(
    'INSERT INTO stock_movements (id, product_id, delta, qty_after, reason, created_at) VALUES (?,?,?,?,?,?)',
    [nanoid(), productId, delta, newQty, reason, new Date().toISOString()]
  );
}

export function setExactStock(productId: string, exactQty: number, reason: string): void {
  const db = getDB();
  const product = findById<Product>('products', productId);
  if (!product) return;

  const delta = exactQty - product.stock_qty;
  db.runSync('UPDATE products SET stock_qty = ?, updated_at = ? WHERE id = ?', [
    exactQty,
    new Date().toISOString(),
    productId,
  ]);

  db.runSync(
    'INSERT INTO stock_movements (id, product_id, delta, qty_after, reason, created_at) VALUES (?,?,?,?,?,?)',
    [nanoid(), productId, delta, exactQty, reason, new Date().toISOString()]
  );
}

export function getStockLevel(productId: string): number {
  const product = findById<Product>('products', productId);
  return product?.stock_qty ?? 0;
}

export function getLowStockProducts(): Product[] {
  return runQuery<Product>(
    `SELECT p.*, c.name as category_name, b.name as brand_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.is_active = 1 AND p.stock_qty <= p.reorder_level
     ORDER BY p.stock_qty ASC`
  );
}

export function getStockMovements(productId: string, limit = 20): StockMovement[] {
  return runQuery<StockMovement>(
    'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT ?',
    [productId, limit]
  );
}
