export interface Product {
  [key: string]: any;
  id?: string;
  name: string;
  barcode?: string;
  stock?: number;
  price?: number;
  category_id?: string;
  brand_id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
