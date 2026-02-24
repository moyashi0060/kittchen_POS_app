// API クライアント - Flask REST APIを使用
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API Error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 注文API
export const ordersApi = {
  list: (sort?: string, limit?: number) => 
    request<Order[]>(`/orders?sort=${sort || '-created_date'}&limit=${limit || 100}`),
  
  create: (data: CreateOrderData) => 
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Order>) => 
    request<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) => 
    request<void>(`/orders/${id}`, {
      method: 'DELETE',
    }),
};

// 商品API
export const productsApi = {
  list: () => request<Product[]>('/products'),
  
  create: (data: CreateProductData) => 
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Product>) => 
    request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) => 
    request<void>(`/products/${id}`, {
      method: 'DELETE',
    }),
};

// ファイルアップロードAPI
export const uploadApi = {
  uploadFile: async (file: File): Promise<{ file_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    return response.json();
  },
};

// 型定義
export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  image_url?: string;
  price?: number;
  note?: string;
}

export interface Order {
  id: string;
  order_number: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  notes?: string;
  total_amount?: number;
  created_date: string;
}

export interface CreateOrderData {
  items: OrderItem[];
  notes?: string;
  order_number?: string;
  status?: string;
  total_amount?: number;
}

export type ProductCategory = 'food' | 'drink' | 'set' | 'other';

export interface Product {
  id: string;
  name: string;
  image_url?: string;
  price?: number;
  is_active: boolean;
  category: ProductCategory;
  description?: string;
}

export interface CreateProductData {
  name: string;
  image_url?: string;
  price?: number;
  is_active?: boolean;
  category: ProductCategory;
  description?: string;
}

// 売上API
export interface TodaySalesResponse {
  date: string;
  total_sales: number;
  total_items: number;
  order_count: number;
  orders: Order[];
}

export const salesApi = {
  getToday: () => request<TodaySalesResponse>('/sales/today'),
};
