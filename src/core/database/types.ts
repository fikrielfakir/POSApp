export interface Product {
  [key: string]: any;
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category_id: string | null;
  brand_id: string | null;
  unit: string;
  sale_price: number;
  cost_price: number;
  tax_pct: number;
  reorder_level: number;
  stock_qty: number;
  description: string | null;
  image_base64: string | null;
  is_active: number;
  created_at: string;
  updated_at: string | null;
  // joined
  category_name?: string;
  brand_name?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  is_default: number;
}

export interface Contact {
  id: string;
  name: string;
  type: 'customer' | 'supplier' | 'both';
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  tax_number: string | null;
  opening_balance: number;
  balance: number;
  notes: string | null;
  image_base64: string | null;
  is_active: number;
  created_at: string;
}

export interface Sale {
  id: string;
  invoice_no: string;
  contact_id: string | null;
  subtotal: number;
  discount_amt: number;
  tax_amt: number;
  total: number;
  paid: number;
  change_amt: number;
  payment_method: string;
  payment_ref: string | null;
  status: 'completed' | 'voided' | 'draft';
  notes: string | null;
  created_at: string;
  // joined
  contact_name?: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  qty: number;
  unit_price: number;
  discount_pct: number;
  tax_pct: number;
  line_total: number;
}

export interface Purchase {
  id: string;
  ref_no: string | null;
  contact_id: string | null;
  subtotal: number;
  tax_amt: number;
  total: number;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  notes: string | null;
  created_at: string;
  contact_name?: string;
  items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  cost_price: number;
  line_total: number;
}

export interface StockMovement {
  id: string;
  product_id: string;
  delta: number;
  qty_after: number;
  reason: string | null;
  created_at: string;
}

export interface StockTransfer {
  id: string;
  from_warehouse: string | null;
  to_warehouse: string | null;
  status: 'draft' | 'completed';
  notes: string | null;
  created_at: string;
}

export interface TransferItem {
  id: string;
  transfer_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
}

export interface SellReturn {
  id: string;
  original_sale_id: string | null;
  contact_id: string | null;
  total: number;
  refund_method: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface ReturnItem {
  id: string;
  return_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  notes: string | null;
  receipt_image_base64: string | null;
  expense_date: string;
  created_at: string;
}

export interface FieldVisit {
  id: string;
  contact_id: string | null;
  contact_name: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  outcome: string | null;
  notes: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  clock_in: string | null;
  clock_out: string | null;
  clock_in_lat: number | null;
  clock_in_lng: number | null;
  clock_out_lat: number | null;
  clock_out_lng: number | null;
  duration_minutes: number | null;
  date: string;
}

export interface Followup {
  id: string;
  contact_id: string | null;
  contact_name: string | null;
  type: 'Call' | 'Visit' | 'Email' | 'WhatsApp' | 'Demo';
  due_date: string;
  notes: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'high' | 'normal' | 'low';
  notification_id: string | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  unit_price: number;
  discount_pct: number;
  tax_pct: number;
}

export interface AppMeta {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  tax_number: string;
  logo_base64: string | null;
  currency: string;
  currency_symbol: string;
  tax_rate: string;
  tax_name: string;
  receipt_footer: string;
  setup_complete: string;
  language: string;
  theme: string;
  auto_lock_minutes: string;
  invoice_prefix: string;
  invoice_sequence: string;
  date_format: string;
  decimal_places: string;
  default_warehouse: string;
}
