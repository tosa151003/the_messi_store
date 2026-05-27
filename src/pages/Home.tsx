import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { motion } from 'motion/react';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-800 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="mb-16 relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-gray-800">
        <div className="absolute inset-0 bg-blue-600/5 mix-blend-screen pointer-events-none"></div>
        <div className="px-8 py-24 sm:px-16 sm:py-32 flex flex-col items-start justify-center relative z-10 text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-amber-500 font-bold tracking-wider uppercase text-sm mb-4 block">Official Merchandise</span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight mb-6 flex flex-col leading-tight">
              <span>Play Like A</span> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">Champion.</span>
            </h1>
            <p className="text-gray-400 text-lg sm:text-xl max-w-xl mb-10">
              Premium football gear, exclusive apparel, and limited edition items inspired by the greatest to ever play.
            </p>
            <button 
              onClick={() => {
                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-xl shadow-white/5"
            >
              Shop Collection
            </button>
          </motion.div>
        </div>
        
        {/* Abstract Gold Accent in Hero */}
        <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      </section>

      {/* Products Grid */}
      <section id="products" className="scroll-mt-24">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">Latest Drops</h2>
          <div className="h-[1px] flex-1 bg-gray-800/60 ml-8"></div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 border border-gray-800 rounded-2xl">
            <p className="text-gray-400">No products available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.4, delay: i * 0.1 }}
                key={product.id} className="group"
              >
                <Link to={`/product/${product.id}`} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 mb-4 transition-colors group-hover:border-gray-700">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-medium">No Image</div>
                    )}
                    <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {product.category}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-500 transition-colors line-clamp-1">{product.name}</h3>
                    <p className="text-gray-400 text-sm mb-2 font-medium">৳{product.price.toFixed(2)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
