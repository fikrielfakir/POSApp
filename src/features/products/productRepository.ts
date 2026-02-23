import { insert, update as updateRow, softDelete, findAll, findById } from '@core/database/dbHelpers';
import { Product } from '@core/database/types';
export { Product } from '@core/database/types';

const TABLE = 'products';

export function createProduct(data: Partial<Product>): string {
  return insert<Product>(TABLE, data as Product);
}

export function getAllProducts(): Product[] {
  return findAll<Product>(TABLE, { where: { is_active: 1 }, orderBy: 'created_at DESC' });
}

export function getProductById(id: string): Product | null {
  return findById<Product>(TABLE, id);
}

export function updateProduct(id: string, data: Partial<Product>): void {
  updateRow<Product>(TABLE, id, data as Product);
}

export function softDeleteProduct(id: string): void {
  softDelete(TABLE, id);
}

export function searchProducts(query: string): Product[] {
  const term = `%${query}%`;
  return findAll<Product>(TABLE, {
    where: { is_active: 1 },
    search: { columns: ['name', 'sku', 'barcode'], term },
  });
}

export function getLowStockProducts(): Product[] {
  return findAll<Product>(TABLE, {
    where: { is_active: 1 },
  }).filter(p => p.stock_qty <= p.reorder_level);
}
