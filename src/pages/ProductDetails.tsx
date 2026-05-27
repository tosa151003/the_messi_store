import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
          toast.error("Product not found");
          navigate('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-800 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) return null;

  const handleAddToCart = async () => {
    if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    try {
      await addToCart(product!.id, 1, selectedSize || undefined);
      toast.success("Added to cart");
    } catch {
      // handled in context
    }
  };

  return (
    <div className="py-8">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Shop
      </button>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="aspect-[4/5] rounded-3xl bg-gray-900 overflow-hidden border border-gray-800 shadow-2xl relative"
        >
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-600">No Image</div>
          )}
          <div className="absolute top-6 left-6 bg-blue-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full font-bold uppercase tracking-wider text-sm shadow-lg">
            {product.category}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col justify-center"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4 leading-tight">{product.name}</h1>
          <p className="text-3xl font-mono text-amber-500 font-medium mb-8">৳{product.price.toFixed(2)}</p>
          
          <div className="prose prose-invert prose-p:text-gray-400 mb-8 max-w-none">
            <p className="text-lg leading-relaxed">{product.description}</p>
          </div>

          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Select Size</h3>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-14 min-w-[3.5rem] px-4 rounded-xl border-2 font-bold transition-all focus:outline-none ${
                      selectedSize === size
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 p-4 rounded-xl text-gray-300">
              <ShieldCheck className="text-blue-500" size={24} />
              <span className="font-medium text-sm">Authentic Merchandise</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 p-4 rounded-xl text-gray-300">
              <Truck className="text-blue-500" size={24} />
              <span className="font-medium text-sm">Fast Global Shipping</span>
            </div>
          </div>

          <button 
            onClick={handleAddToCart}
            className="w-full bg-white text-gray-950 hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all px-8 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-white/10"
          >
            <ShoppingCart size={22} />
            Add to Cart
          </button>
        </motion.div>
      </div>
    </div>
  );
}
