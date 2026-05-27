import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAdmin, logout, setAuthModalOpen } = useAuth();
  const { items } = useCart();
  
  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwO44YJ2MtVBA4GoBlRQURVw2d61gcGnVwhg&s" 
              alt="The Messi Store Logo" 
              className="h-10 w-auto object-contain transform group-hover:scale-105 transition-transform" 
              referrerPolicy="no-referrer"
            />
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-amber-500 transition-colors">The Messi Store</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/cart" className="relative text-gray-400 hover:text-white transition-colors">
              <ShoppingCart size={22} />
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-gray-950 text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                  {totalCartItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link to="/admin" className="text-gray-400 hover:text-amber-500 transition-colors flex items-center gap-1">
                    <Shield size={18} />
                    <span className="text-sm font-medium hidden sm:inline">Admin</span>
                  </Link>
                )}
                <Link to="/profile" className="text-gray-400 hover:text-white transition-colors">
                  <User size={22} />
                </Link>
                <button onClick={logout} className="text-gray-400 hover:text-red-400 transition-colors">
                  <LogOut size={22} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
