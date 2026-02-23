import { getDB } from '../database/db';
import { setMeta, getMeta } from '../database/dbHelpers';
import { QRPayload } from './qrDecoder';

export interface SeedResult {
  seeded: {
    products: number;
    contacts: number;
    categories: number;
    brands: number;
    warehouses: number;
    transfers: number;
  };
  errors: string[];
  duration_ms: number;
}

export function seedFromPayload(payload: QRPayload): SeedResult {
  const db = getDB();
  const start = Date.now();
  const result: SeedResult = {
    seeded: { products: 0, contacts: 0, categories: 0, brands: 0, warehouses: 0, transfers: 0 },
    errors: [],
    duration_ms: 0,
  };

  const now = new Date().toISOString();

  // Handle stock transfer separately (no transaction needed)
  if (payload.type === 'pos_stock_transfer' && payload.stock_transfers) {
    for (const transfer of payload.stock_transfers) {
      try {
        const transferId = transfer.id || `TRF-${Date.now()}`;
        db.runSync(
          `INSERT INTO stock_transfers (id, from_warehouse, to_warehouse, status, notes, created_at)
           VALUES (?, ?, ?, 'completed', ?, ?)`,
          [transferId, transfer.from_warehouse, transfer.to_warehouse, transfer.notes ?? null, now]
        );
        
        for (const item of transfer.items) {
          // Deduct from source warehouse
          db.runSync(
            `UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?`,
            [item.quantity, item.product_id]
          );
          // Add to destination warehouse (same product, different logic)
          db.runSync(
            `UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?`,
            [item.quantity, item.product_id]
          );
          // Record movement
          db.runSync(
            `INSERT INTO stock_movements (id, product_id, delta, reason, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            [`MOV-${Date.now()}-${item.product_id}`, item.product_id, -item.quantity, `Transfer to ${transfer.to_warehouse}`, now]
          );
        }
        result.seeded.transfers++;
      } catch (e) {
        result.errors.push(`Transfer ${transfer.id}: ${String(e)}`);
      }
    }
    result.duration_ms = Date.now() - start;
    return result;
  }

  // Handle data seeding (init, update, add)
  db.withTransactionSync(() => {
    const isUpdate = payload.type === 'pos_update';
    const isAddProducts = payload.type === 'pos_add_products';
    const isAddContacts = payload.type === 'pos_add_contacts';

    // Clear existing data for full update
    if (isUpdate) {
      db.runSync('DELETE FROM sale_items');
      db.runSync('DELETE FROM sales');
      db.runSync('DELETE FROM products');
      db.runSync('DELETE FROM contacts');
      db.runSync('DELETE FROM categories');
      db.runSync('DELETE FROM brands');
      db.runSync('DELETE FROM warehouses');
    }

    // 1. Company meta (only for init/update)
    if ((payload.type === 'pos_init' || payload.type === 'pos_update') && payload.company) {
      const c = payload.company;
      const metaMap: Record<string, string> = {
        company_name: c.name ?? '',
        company_address: c.address ?? '',
        company_phone: c.phone ?? '',
        company_email: c.email ?? '',
        tax_number: c.tax_number ?? '',
        currency: c.currency ?? 'USD',
        currency_symbol: c.currency_symbol ?? '$',
        tax_rate: String(c.tax_rate ?? 0),
        tax_name: c.tax_name ?? 'Tax',
        receipt_footer: c.receipt_footer ?? 'Thank you for your business!',
      };
      for (const [k, v] of Object.entries(metaMap)) {
        setMeta(k, v);
      }
    }

    // 2. Warehouses (init/update only)
    if ((payload.type === 'pos_init' || payload.type === 'pos_update') && payload.warehouses) {
      for (const w of payload.warehouses) {
        try {
          db.runSync(
            `INSERT OR REPLACE INTO warehouses (id, name, location, is_default) VALUES (?,?,?,?)`,
            [w.id, w.name, w.location ?? null, w.is_default ? 1 : 0]
          );
          result.seeded.warehouses++;
        } catch (e) {
          result.errors.push(`Warehouse ${w.id}: ${String(e)}`);
        }
      }
    }

    // 3. Categories (init/update only)
    if ((payload.type === 'pos_init' || payload.type === 'pos_update') && payload.categories) {
      for (const cat of payload.categories) {
        try {
          db.runSync(
            `INSERT OR REPLACE INTO categories (id, name, color, icon, created_at) VALUES (?,?,?,?,?)`,
            [cat.id, cat.name, cat.color ?? '#3B82F6', cat.icon ?? 'tag', now]
          );
          result.seeded.categories++;
        } catch (e) {
          result.errors.push(`Category ${cat.id}: ${String(e)}`);
        }
      }
    }

    // 4. Brands (init/update only)
    if ((payload.type === 'pos_init' || payload.type === 'pos_update') && payload.brands) {
      for (const b of payload.brands) {
        try {
          db.runSync(
            `INSERT OR REPLACE INTO brands (id, name, created_at) VALUES (?,?,?)`,
            [b.id, b.name, now]
          );
          result.seeded.brands++;
        } catch (e) {
          result.errors.push(`Brand ${b.id}: ${String(e)}`);
        }
      }
    }

    // 5. Products (init/update/add)
    if ((!isAddContacts) && payload.products) {
      for (const p of payload.products) {
        try {
          // For add only, skip if product exists
          if (isAddProducts) {
            const exists = db.getFirstSync<{ id: string }>('SELECT id FROM products WHERE id = ?', [p.id]);
            if (exists) continue;
          }
          
          const existing = db.getFirstSync<{ stock_qty: number }>(
            'SELECT stock_qty FROM products WHERE id = ?', [p.id]
          );
          const stockQty = existing ? existing.stock_qty : (p.stock_qty ?? 0);

          db.runSync(
            `INSERT OR REPLACE INTO products
             (id, name, sku, barcode, category_id, brand_id, unit,
              sale_price, cost_price, tax_pct, reorder_level, stock_qty,
              description, is_active, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
            [
              p.id, p.name, p.sku ?? null, p.barcode ?? null,
              p.category_id ?? null, p.brand_id ?? null,
              p.unit ?? 'pcs', p.sale_price, p.cost_price ?? 0,
              p.tax_pct ?? 0, p.reorder_level ?? 0, stockQty,
              p.description ?? null, now, now,
            ]
          );
          result.seeded.products++;
        } catch (e) {
          result.errors.push(`Product ${p.id}: ${String(e)}`);
        }
      }
    }

    // 6. Contacts (init/update/add)
    if ((!isAddProducts) && payload.contacts) {
      for (const c of payload.contacts) {
        // For add only, skip if contact exists
        if (payload.type === 'pos_add_contacts') {
          const exists = db.getFirstSync<{ id: string }>('SELECT id FROM contacts WHERE id = ?', [c.id]);
          if (exists) continue;
        }
        
        try {
          db.runSync(
            `INSERT OR REPLACE INTO contacts
             (id, name, type, phone, email, address, opening_balance, balance, is_active, created_at)
             VALUES (?,?,?,?,?,?,?,?,1,?)`,
            [
              c.id, c.name, c.contact_type ?? c.type ?? 'customer',
              c.phone ?? null, c.email ?? null, c.address ?? null,
              c.opening_balance ?? 0, c.opening_balance ?? 0, now,
            ]
          );
          result.seeded.contacts++;
        } catch (e) {
          result.errors.push(`Contact ${c.id}: ${String(e)}`);
        }
      }
    }

    // 7. Mark setup complete
    if (payload.type === 'pos_init') {
      setMeta('setup_complete', '1');
    }
    setMeta('last_seed_date', now);
    setMeta('last_seed_counts', JSON.stringify(result.seeded));
  });

  result.duration_ms = Date.now() - start;
  return result;
}

export function canReseed(): boolean { return true; }

export function getLastSeedInfo(): { date: string; counts: Record<string, number> } | null {
  const date = getMeta('last_seed_date');
  const countsStr = getMeta('last_seed_counts');
  if (!date || !countsStr) return null;
  try {
    return { date, counts: JSON.parse(countsStr) };
  } catch {
    return null;
  }
}
