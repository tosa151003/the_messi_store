import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Product } from '../types';
import { Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [productDetails, setProductDetails] = useState<Record<string, Product>>({});
  const [fetchingDetails, setFetchingDetails] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      if (items.length === 0) return;
      setFetchingDetails(true);
      const details: Record<string, Product> = {};
      
      for (const item of items) {
        if (!productDetails[item.productId]) {
          const docRef = doc(db, 'products', item.productId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            details[item.productId] = { id: docSnap.id, ...docSnap.data() } as Product;
          }
        } else {
          details[item.productId] = productDetails[item.productId];
        }
      }
      
      setProductDetails(details);
      setFetchingDetails(false);
    }
    loadDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  if (loading || fetchingDetails) {
    return <div className="text-center py-20">Loading cart...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-32 bg-gray-900 border border-gray-800 rounded-3xl mt-12">
        <h2 className="text-3xl font-bold text-white mb-4">Your Cart</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">Please sign in to view and manage your shopping cart.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
       <div className="text-center py-32 bg-gray-900 border border-gray-800 rounded-3xl mt-12">
        <h2 className="text-3xl font-bold text-white mb-4">Your Cart is Empty</h2>
        <p className="text-gray-400 mb-8">Looks like you haven't added any items to your cart yet.</p>
        <Link to="/" className="inline-flex bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((acc, item) => {
    const p = productDetails[item.productId];
    return acc + ((p?.price || 0) * item.quantity);
  }, 0);

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Shopping Cart</h1>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-8 space-y-6 flex-1">
          {items.map((item, i) => {
            const p = productDetails[item.productId];
            if (!p) return null;
            return (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }}
                className="flex flex-col sm:flex-row items-center gap-6 bg-gray-900 border border-gray-800 p-4 rounded-2xl"
              >
                <Link to={`/product/${p.id}`} className="w-full sm:w-32 aspect-square rounded-xl overflow-hidden bg-gray-950 flex-shrink-0">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">No Img</div>
                  )}
                </Link>
                
                <div className="flex-1 w-full text-center sm:text-left">
                  <Link to={`/product/${p.id}`}><h3 className="text-lg font-bold text-white hover:text-amber-500 transition-colors">{p.name}</h3></Link>
                  <p className="text-gray-400 text-sm mt-1">{p.category}</p>
                  {item.size && <p className="text-gray-300 text-sm mt-1 font-bold">Size: <span className="text-amber-500">{item.size}</span></p>}
                  <p className="text-amber-500 font-mono font-medium mt-2">৳{p.price.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-3 bg-gray-950 border border-gray-800 rounded-lg p-1">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white bg-gray-900 rounded-md transition-colors"
                    >-</button>
                    <span className="w-6 text-center font-medium font-mono text-white">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white bg-gray-900 rounded-md transition-colors"
                    >+</button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
        
        <div className="lg:col-span-4 mt-10 lg:mt-0">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 sticky top-24">
            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 text-gray-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-mono text-green-400">Free</span>
              </div>
              <div className="h-px bg-gray-800 w-full my-4"></div>
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Total</span>
                <span className="font-mono text-amber-500">৳{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/checkout', { state: { subtotal, items, productDetails } })}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xl shadow-blue-500/20"
            >
              Proceed to Checkout
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
