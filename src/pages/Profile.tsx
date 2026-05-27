import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Order } from '../types';
import { Package, Clock, ShieldCheck, User as UserIcon, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      if (!authLoading) navigate('/');
      return;
    }

    async function fetchMyOrders() {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user!.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order));
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyOrders();
  }, [user, authLoading, navigate]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'cancelled' });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      toast.success("Order cancelled successfully");
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order");
    }
  };

  if (authLoading || loading) return <div className="text-center py-20">Loading profile...</div>;

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-6 mb-12 bg-gray-900 border border-gray-800 p-8 rounded-3xl">
        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-950">
          <UserIcon size={32} className="text-blue-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">My Account</h1>
          <p className="text-gray-400 font-medium">{user?.email}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Package className="text-amber-500" /> Order History
      </h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-2xl">
          <p className="text-gray-400">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              key={order.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1 flex items-center gap-1">
                    <Clock size={14}/> {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="font-mono text-gray-300 font-bold tracking-wider">#{order.id.slice(-8).toUpperCase()}</p>
                </div>
                
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider
                  ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : ''}
                  ${order.status === 'payment_received' ? 'bg-blue-500/10 text-blue-500' : ''}
                  ${order.status === 'delivery_in_progress' ? 'bg-indigo-500/10 text-indigo-500' : ''}
                  ${order.status === 'delivery_successful' ? 'bg-green-500/10 text-green-500' : ''}
                  ${order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : ''}
                `}>
                  {order.status.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="border-t border-gray-800/60 pt-6">
                <div className="mb-4">
                  <h4 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Items</h4>
                  <ul className="space-y-3">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-300"><span className="text-gray-500 mr-2">{item.quantity}x</span>{item.name} {item.size && <span className="text-amber-500 font-bold ml-1">({item.size})</span>}</span>
                        <span className="text-gray-400 font-mono">৳{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-between items-center bg-gray-950 p-4 rounded-xl mt-6 border border-gray-800">
                  <div className="text-sm">
                    <span className="text-gray-500">Paid via: </span>
                    <span className="text-gray-300 uppercase font-bold">{order.paymentMethod}</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    Total: <span className="text-amber-500 font-mono ml-2">৳{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => handleCancelOrder(order.id)}
                      className="flex items-center gap-2 text-sm font-bold text-red-400 bg-red-400/10 hover:bg-red-400/20 px-4 py-2 rounded-lg transition-colors"
                    >
                      <XCircle size={16} /> Cancel Order
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
