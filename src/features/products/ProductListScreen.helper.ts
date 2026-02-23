import { Product } from './types';
import { getAllProducts as fetchAll } from './productRepository';

export async function getAllProducts(): Promise<Product[]> {
  const list = fetchAll();
  return Promise.resolve(list);
}
