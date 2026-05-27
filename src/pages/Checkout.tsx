import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();
  
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!state || !state.items || !user) {
    return <div className="text-center py-20">Invalid session. Please return to cart.</div>;
  }

  const { subtotal, items, productDetails } = state;

  const getPaymentDetails = (m: string) => {
    switch (m) {
      case 'bkash': return { name: 'bKash', number: '01342506092', color: 'bg-pink-600' };
      case 'nagad': return { name: 'Nagad', number: '01342506092', color: 'bg-orange-600' };
      case 'rocket': return { name: 'Rocket', number: '01342506092', color: 'bg-purple-600' };
      default: return null;
    }
  }

  const pDetails = getPaymentDetails(method);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId || !paymentNumber) {
      toast.error("Please fill all payment details");
      return;
    }

    setLoading(true);
    try {
      const orderItems = items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: productDetails[i.productId].price,
        name: productDetails[i.productId].name,
        size: i.size || null
      }));

      // Create Order
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        userEmail: user.email || 'N/A',
        items: orderItems,
        totalAmount: subtotal,
        status: 'pending',
        paymentMethod: method,
        paymentNumber: paymentNumber,
        trxId: trxId,
        createdAt: Date.now(),
        notes: notes
      });

      // Create Payment verification log
      await addDoc(collection(db, 'payments'), {
        orderId: orderRef.id,
        trxId: trxId,
        amount: subtotal,
        status: 'pending',
        createdAt: Date.now()
      });

      await clearCart();
      toast.success("Order placed successfully! Waiting for admin confirmation.", { duration: 5000 });
      navigate('/profile');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 font-medium">
        <span>Cart</span> <ChevronRight size={14} /> <span className="text-white">Checkout</span>
      </div>

      <h1 className="text-3xl font-bold text-white mb-8">Secure Checkout</h1>
      
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-10 mb-8">
        <h2 className="text-xl font-bold text-white mb-6">Payment Method</h2>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          {(['bkash', 'nagad', 'rocket'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`p-4 rounded-xl border-2 transition-all font-bold uppercase tracking-wider text-sm
                ${method === m ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'}
              `}
            >
              {m}
            </button>
          ))}
        </div>

        <motion.div 
          key={method}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-950 border border-gray-800 p-6 rounded-2xl mb-8"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`text-white font-bold px-4 py-1 rounded-full text-xs uppercase tracking-widest ${pDetails?.color}`}>
              {pDetails?.name} Personal
            </div>
            <p className="text-gray-400">Please send <span className="text-white font-bold font-mono">৳{subtotal.toFixed(2)}</span> to the number below:</p>
            <p className="text-4xl font-mono font-bold text-white tracking-widest">{pDetails?.number}</p>
            <p className="text-xs text-gray-500">Do not include any reference. Keep your Transaction ID safe.</p>
          </div>
        </motion.div>

        <form onSubmit={handlePlaceOrder} className="space-y-6">
          <div>
             <label className="block text-sm font-medium text-gray-400 mb-2">Sender's Mobile Number</label>
             <input 
              required
              value={paymentNumber}
              onChange={e => setPaymentNumber(e.target.value)}
              placeholder="e.g. 017XXXXXX"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:font-sans"
             />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-400 mb-2">Transaction ID (TrxID)</label>
             <input 
              required
              value={trxId}
              onChange={e => setTrxId(e.target.value)}
              placeholder="e.g. 9FGEH8JK"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:font-sans uppercase"
             />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-400 mb-2">Order Notes (Optional)</label>
             <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any specific delivery instructions or notes for the admin"
              rows={3}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-y placeholder:text-gray-600"
             />
          </div>

          <div className="pt-6 border-t border-gray-800">
             <button 
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-lg py-5 rounded-xl transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50"
             >
                {loading ? 'Processing...' : `Confirm Order (৳${subtotal.toFixed(2)})`}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
