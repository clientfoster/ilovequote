import { apiRequest } from './api';

export type SavedProduct = {
  id: string;
  ownerUserId?: string;
  name: string;
  description: string;
  itemType: 'Product' | 'Service';
  unit: string;
  price: number;
  gstRate: number;
  complimentary: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductInput = Omit<SavedProduct, 'id' | 'ownerUserId' | 'createdAt' | 'updatedAt'>;

export async function fetchProducts() {
  const payload = await apiRequest<{ items: SavedProduct[] }>('/api/products', { method: 'GET' });
  return payload.items || [];
}

export async function createProduct(product: ProductInput) {
  return apiRequest<{ item: SavedProduct }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id: string, product: ProductInput) {
  return apiRequest<{ item: SavedProduct }>(`/api/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: string) {
  return apiRequest<{ ok: true }>(`/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
