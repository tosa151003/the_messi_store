import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Product, Order } from '../types';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Package, ShoppingBag, CreditCard, Trash2, Edit, Settings } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings'>('products');
  
  // Settings State
  const [settingUser, setSettingUser] = useState(localStorage.getItem('customAdminUser') || 'sajid_dev');
  const [settingPass, setSettingPass] = useState(localStorage.getItem('customAdminPass') || 'KOna4321');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('customAdminUser', settingUser);
    localStorage.setItem('customAdminPass', settingPass);
    toast.success("Admin login credentials updated!");
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // New Product State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pImg, setPImg] = useState('');
  const [pCat, setPCat] = useState('Clothing');
  const [pSizes, setPSizes] = useState<string[]>([]);

  const [editProductId, setEditProductId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchOrders();
    }
  }, [isAdmin]);

  const fetchProducts = async () => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Product));
    setLoading(false);
  };

  const fetchOrders = async () => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Order));
  };

  const orderStats = React.useMemo(() => {
    const stats: Record<string, number> = {
      pending: 0,
      payment_received: 0,
      delivery_in_progress: 0,
      delivery_successful: 0,
      cancelled: 0,
    };
    orders.forEach(o => {
      if (stats[o.status] !== undefined) {
        stats[o.status]++;
      }
    });
    return [
      { name: 'Pending', value: stats.pending, color: '#f59e0b' },
      { name: 'Payment Rx', value: stats.payment_received, color: '#3b82f6' },
      { name: 'In Progress', value: stats.delivery_in_progress, color: '#6366f1' },
      { name: 'Delivered', value: stats.delivery_successful, color: '#22c55e' },
      { name: 'Cancelled', value: stats.cancelled, color: '#ef4444' }
    ];
  }, [orders]);

  if (authLoading || loading) return <div className="text-center py-20">Loading Dashboard...</div>;

  if (!isAdmin) {
    return (
      <div className="text-center py-20 bg-gray-900 border border-red-900 rounded-xl">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h2>
        <p className="text-gray-400">You must be an admin to view this page.</p>
      </div>
    );
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editProductId) {
        await updateDoc(doc(db, 'products', editProductId), {
          name: pName,
          description: pDesc,
          price: parseFloat(pPrice),
          imageUrl: pImg,
          category: pCat,
          sizes: pSizes.length > 0 ? pSizes : null
        });
        toast.success("Product updated!");
      } else {
        await addDoc(collection(db, 'products'), {
          name: pName,
          description: pDesc,
          price: parseFloat(pPrice),
          imageUrl: pImg,
          category: pCat,
          sizes: pSizes.length > 0 ? pSizes : null,
          createdAt: Date.now()
        });
        toast.success("Product added!");
      }
      setShowAddProduct(false);
      setEditProductId(null);
      setPName(''); setPDesc(''); setPPrice(''); setPImg(''); setPSizes([]);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEditProduct = (p: Product) => {
    setEditProductId(p.id);
    setPName(p.name);
    setPDesc(p.description);
    setPPrice(p.price.toString());
    setPImg(p.imageUrl);
    setPCat(p.category);
    setPSizes(p.sizes || []);
    setShowAddProduct(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success("Product deleted");
      fetchProducts();
    } catch(err:any) { toast.error(err.message); }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      toast.success("Status updated");
      fetchOrders();
    } catch(err:any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Admin Control Panel</h1>
        
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
          <button 
            onClick={() => setActiveTab('products')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'products' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Package size={16} /> Products
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'orders' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <ShoppingBag size={16} /> Orders
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'settings' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Settings size={16} /> Settings
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center bg-gray-900 border border-gray-800 p-6 rounded-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">Product Catalog</h2>
              <p className="text-gray-400 text-sm mt-1">Manage store inventory</p>
            </div>
            <button 
              onClick={() => {
                setShowAddProduct(!showAddProduct);
                if (showAddProduct) setEditProductId(null);
                setPName(''); setPDesc(''); setPPrice(''); setPImg(''); setPSizes([]);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 flex items-center justify-center rounded-lg font-medium transition-colors"
            >
              {showAddProduct ? 'Cancel' : '+ Add Product'}
            </button>
          </div>

          {showAddProduct && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }}
              onSubmit={handleSaveProduct} 
              className="bg-gray-900 border border-gray-800 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
            >
              <div>
                <label className="block text-sm text-gray-400 mb-1">Product Name</label>
                <input required value={pName} onChange={e=>setPName(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Price (৳)</label>
                <input required type="number" step="0.01" value={pPrice} onChange={e=>setPPrice(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select value={pCat} onChange={e=>setPCat(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white">
                  <option>Clothing</option>
                  <option>Footwear</option>
                  <option>Accessories</option>
                  <option>Memorabilia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Image URL</label>
                <input required value={pImg} onChange={e=>setPImg(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white" placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Sizes (Optional)</label>
                <div className="flex gap-3">
                  {['M', 'L', 'XL', 'XXL'].map(size => (
                    <label key={size} className="flex items-center gap-2 text-white cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-800 bg-gray-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900"
                        checked={pSizes.includes(size)}
                        onChange={(e) => {
                          if (e.target.checked) setPSizes([...pSizes, size]);
                          else setPSizes(pSizes.filter(s => s !== size));
                        }}
                      />
                      <span>{size}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea required value={pDesc} onChange={e=>setPDesc(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white h-24" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-6 py-2 rounded-lg transition-colors">
                  {editProductId ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </motion.form>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-950 text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-800 overflow-hidden">
                          {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <div className="font-medium line-clamp-1">{p.name}</div>
                          {p.sizes && p.sizes.length > 0 && <div className="text-xs text-amber-500 font-bold mt-0.5">Sizes: {p.sizes.join(', ')}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="bg-gray-800 px-2.5 py-1 rounded-md text-xs">{p.category}</span></td>
                    <td className="px-6 py-4 font-mono font-medium">৳{p.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEditProduct(p)} className="p-2 text-gray-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors mr-2">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                   <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'orders' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden p-6 text-xl font-bold">
            Order Management
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-6">Orders Overview</h2>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search orders by ID or Phone Number..."
                value={orderSearchQuery}
                onChange={e => setOrderSearchQuery(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-gray-600"
              />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff' }}
                    cursor={{ fill: '#374151', opacity: 0.2 }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {orderStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-4">
            {orders
              .filter(o => o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || o.paymentNumber.includes(orderSearchQuery))
              .map(order => (
              <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold font-mono text-gray-300">Order #{order.id.slice(-6).toUpperCase()}</h3>
                    <p className="text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                    <div className="mt-2 text-sm max-w-xs">
                      <p className="text-gray-400">Customer Email: <span className="text-gray-200">{order.userEmail || 'N/A'}</span></p>
                      <p className="text-gray-400">Contact Number: <span className="text-gray-200">{order.paymentNumber}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`font-medium text-sm rounded-lg border py-1.5 px-3 uppercase tracking-wider
                        ${order.status === 'pending' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : ''}
                        ${order.status === 'payment_received' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : ''}
                        ${order.status === 'delivery_in_progress' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' : ''}
                        ${order.status === 'delivery_successful' ? 'bg-green-500/10 border-green-500/30 text-green-500' : ''}
                        ${order.status === 'cancelled' ? 'bg-red-500/10 border-red-500/30 text-red-500' : ''}
                      `}
                    >
                      <option value="pending">Pending</option>
                      <option value="payment_received">Payment Received</option>
                      <option value="delivery_in_progress">Delivery in Progress</option>
                      <option value="delivery_successful">Delivery Successful</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-gray-800/60">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1"><CreditCard size={14}/> Payment Details</h4>
                    <p className="text-gray-300"><span className="text-gray-500">Method:</span> <span className="uppercase">{order.paymentMethod}</span></p>
                    <p className="text-gray-300"><span className="text-gray-500">Number:</span> {order.paymentNumber}</p>
                    <p className="text-gray-300"><span className="text-gray-500">TrxID:</span> <span className="font-mono text-amber-400">{order.trxId}</span></p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Order Summary</h4>
                    <ul className="space-y-1 mb-2">
                      {order.items.map((it, i) => (
                        <li key={i} className="text-gray-300 text-sm flex justify-between">
                          <span>{it.quantity}x {it.name} {it.size && <span className="text-amber-500 text-xs font-bold ml-1">({it.size})</span>}</span>
                          <span className="text-gray-500">৳{(it.price * it.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between font-bold text-lg text-white border-t border-gray-800 pt-2 mb-3">
                      <span>Total:</span>
                      <span>৳{order.totalAmount.toFixed(2)}</span>
                    </div>
                    {order.notes && (
                      <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Order Notes</p>
                        <p className="text-sm text-gray-300 italic">{order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {orders.filter(o => o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || o.paymentNumber.includes(orderSearchQuery)).length === 0 && (
              <div className="text-center py-12 text-gray-500">No orders found.</div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'settings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Admin Settings</h2>
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-md">
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl text-sm mb-6">
                Change the custom username and password required to access this admin panel. 
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Admin Username</label>
                <input 
                  required
                  value={settingUser}
                  onChange={e => setSettingUser(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Admin Password</label>
                <input 
                  required
                  value={settingPass}
                  onChange={e => setSettingPass(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-3 px-6 rounded-xl transition-all">
                Update Admin Login
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}
