import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, setDoc, doc, deleteDoc, runTransaction } from 'firebase/firestore';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  addedAt: number;
  size?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (productId: string, quantity?: number, size?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, `carts/${user.uid}/items`), (snapshot) => {
      const newItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CartItem[];
      setItems(newItems.sort((a, b) => b.addedAt - a.addedAt));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching cart:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addToCart = async (productId: string, quantity = 1, size?: string) => {
    if (!user) {
      alert("Please sign in to add items to your cart.");
      return;
    }
    const cartItemId = size ? `${productId}_${size}` : productId;
    const cartRef = doc(db, `carts/${user.uid}/items`, cartItemId);
    await setDoc(cartRef, {
      productId,
      quantity,
      size,
      addedAt: Date.now()
    }, { merge: true });
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `carts/${user.uid}/items`, itemId));
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }
    await setDoc(doc(db, `carts/${user.uid}/items`, itemId), {
      quantity
    }, { merge: true });
  };

  const clearCart = async () => {
    if (!user) return;
    // this could be done in a batch
    for (const item of items) {
      await removeFromCart(item.id);
    }
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, loading }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within CartProvider');
  return context;
};
