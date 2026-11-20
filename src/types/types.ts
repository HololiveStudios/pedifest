// src/types/types.ts
import { Timestamp } from "firebase/firestore";

export type Product = {
  id?: string;
  name: string;
  description?: string;
  images?: string[];
  price: number;
  sku?: string;
  available: boolean;
  categories?: string[];
  extras?: { id: string; name: string; price: number }[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type Combo = {
  id?: string;
  name: string;
  items: { productId: string; qty: number }[];
  price: number;
  steps?: string[];
  schedule?: {
    weekdays?: number[];
    start?: string;
    end?: string;
  };
};

export type Promotion = {
  id?: string;
  title: string;
  type: "percent" | "fixed" | "buyXgetY";
  value: number;
  channels: string[];
  schedule: {
    start: Timestamp;
    end: Timestamp;
    weekdays?: number[];
    hours?: { from: string; to: string }[];
  };
  active: boolean;
};

export type OrderItem = {
  productId: string;
  name: string;
  qty: number;
  price: number;
  extras?: any[];
};

export type Order = {
  id?: string;
  orderNumber?: number;
  storeId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  customer: {
    id?: string;
    name?: string;
    phone?: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  payment: {
    method: "cash" | "card" | "pix" | "online";
    status: "pending" | "paid" | "failed";
  };
  type: "pickup" | "delivery" | "drive-thru";
  status: "new" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  tracking?: {
    driverId?: string;
    eta?: number;
    geoPath?: any[];
  };
  channel?: string;
  formattedForProduction?: string;
};

// src/types/types.ts (adicione)
export interface PublicStoreData {
  nomeLoja: string;
  logo?: string;
  produtos: Array<{
    id: string;
    nome: string;
    preco: number;
    imagem?: string;
  }>;
}

export type StoreSettings = {
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  openingHours: { [key: string]: { open: string; close: string } };
  taxRate: number;
  deliveryFee: number;
  minOrderValue: number;
  acceptCash: boolean;
  acceptCard: boolean;
  acceptPix: boolean;
};