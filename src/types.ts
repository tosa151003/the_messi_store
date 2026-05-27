export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  sizes?: string[];
  createdAt: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail?: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    name: string;
    size?: string;
  }[];
  totalAmount: number;
  status: 'pending' | 'payment_received' | 'delivery_in_progress' | 'delivery_successful' | 'cancelled';
  paymentMethod: 'bkash' | 'nagad' | 'rocket';
  paymentNumber: string;
  trxId: string;
  createdAt: number;
  notes?: string;
}
