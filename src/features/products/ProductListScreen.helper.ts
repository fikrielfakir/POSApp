import { Product } from '@core/database/types';
import { getAllProducts as fetchAll } from './productRepository';

export function getAllProducts(): Product[] {
  return fetchAll();
}
