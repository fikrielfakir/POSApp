import * as SQLite from 'expo-sqlite';

export function runMigrations(db: SQLite.SQLiteDatabase): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      icon TEXT DEFAULT 'tag',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      barcode TEXT,
      category_id TEXT,
      brand_id TEXT,
      unit TEXT DEFAULT 'pcs',
      sale_price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      tax_pct REAL DEFAULT 0,
      reorder_level INTEGER DEFAULT 0,
      stock_qty REAL DEFAULT 0,
      description TEXT,
      image_base64 TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('customer','supplier','both')) DEFAULT 'customer',
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      tax_number TEXT,
      opening_balance REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      notes TEXT,
      image_base64 TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      invoice_no TEXT UNIQUE NOT NULL,
      contact_id TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_amt REAL DEFAULT 0,
      tax_amt REAL DEFAULT 0,
      total REAL NOT NULL,
      paid REAL DEFAULT 0,
      change_amt REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      payment_ref TEXT,
      status TEXT DEFAULT 'completed',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      product_sku TEXT,
      qty REAL NOT NULL,
      unit_price REAL NOT NULL,
      discount_pct REAL DEFAULT 0,
      tax_pct REAL DEFAULT 0,
      line_total REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      ref_no TEXT,
      contact_id TEXT,
      subtotal REAL DEFAULT 0,
      tax_amt REAL DEFAULT 0,
      total REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      qty REAL NOT NULL,
      cost_price REAL NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id)
    );

    CREATE TABLE IF NOT EXISTS stock_transfers (
      id TEXT PRIMARY KEY,
      from_warehouse TEXT,
      to_warehouse TEXT,
      status TEXT DEFAULT 'draft',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transfer_items (
      id TEXT PRIMARY KEY,
      transfer_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      qty REAL NOT NULL,
      FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id)
    );

    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      sale_id TEXT,
      contact_id TEXT,
      tracking_no TEXT,
      carrier TEXT,
      status TEXT DEFAULT 'pending',
      shipped_at TEXT,
      delivered_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sell_returns (
      id TEXT PRIMARY KEY,
      original_sale_id TEXT,
      contact_id TEXT,
      total REAL NOT NULL,
      refund_method TEXT DEFAULT 'cash',
      reason TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS return_items (
      id TEXT PRIMARY KEY,
      return_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      qty REAL NOT NULL,
      unit_price REAL NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY (return_id) REFERENCES sell_returns(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      receipt_image_base64 TEXT,
      expense_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      delta REAL NOT NULL,
      qty_after REAL NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS field_visits (
      id TEXT PRIMARY KEY,
      contact_id TEXT,
      contact_name TEXT,
      check_in_time TEXT,
      check_out_time TEXT,
      check_in_lat REAL,
      check_in_lng REAL,
      check_out_lat REAL,
      check_out_lng REAL,
      outcome TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      clock_in TEXT,
      clock_out TEXT,
      clock_in_lat REAL,
      clock_in_lng REAL,
      clock_out_lat REAL,
      clock_out_lng REAL,
      duration_minutes INTEGER,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS followups (
      id TEXT PRIMARY KEY,
      contact_id TEXT,
      contact_name TEXT,
      type TEXT,
      due_date TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'normal',
      notification_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_contact_id ON sales(contact_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
    CREATE INDEX IF NOT EXISTS idx_followups_due_date ON followups(due_date);
  `);
}
