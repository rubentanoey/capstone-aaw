export interface Product {
  id: string;
  name: string;
  tenant_id: string;
  description: string | null;
  price: number;
  quantity_available: number;
  category_id: string | null;
}
