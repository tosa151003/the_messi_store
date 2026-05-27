import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Phone, User as UserIcon, Shield } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'admin'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const ADMIN_U = localStorage.getItem('customAdminUser') || 'sajid_dev';
    const ADMIN_P = localStorage.getItem('customAdminPass') || 'KOna4321';

    try {
      if (authMode === 'admin') {
        if (email !== ADMIN_U || password !== ADMIN_P) {
          toast.error("Invalid admin credentials");
          setLoading(false);
          return;
        }
        
        // Use local storage bypass since Firebase Auth Email/Password is disabled in Starter tier
        localStorage.setItem('admin_session', 'true');
        toast.success("Admin logged in successfully!");
        setAuthModalOpen(false);
        setLoading(false);
        window.location.reload(); // Hard reload to quickly apply the mock session contexts
        return;
      }

      if (!email.includes('@')) {
        toast.error("Please enter a valid email address");
        setLoading(false);
        return;
      }

      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created successfully!");
        setAuthModalOpen(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Successfully logged in!");
        setAuthModalOpen(false);
      }
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        toast.error("SETUP REQUIRED: Go to Firebase Console -> Authentication -> Sign-in method and enable 'Email/Password'.", { duration: 8000 });
      } else {
        toast.error(error.message || "Failed to authenticate");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Logged in with Google!");
      setAuthModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePhone = () => {
    toast.error("Phone authentication is temporarily disabled in this environment.");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setAuthModalOpen(false)}
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl"
        >
          <button 
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
          
          <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">
            {authMode === 'login' && 'Welcome Back'}
            {authMode === 'signup' && 'Join The Club'}
            {authMode === 'admin' && 'Admin Access'}
          </h2>

          <div className="flex bg-gray-950 border border-gray-800 p-1 rounded-lg mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${authMode === 'login' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${authMode === 'signup' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setAuthMode('admin')}
              className={`flex-1 py-1.5 text-sm font-medium flex items-center justify-center gap-1 rounded-md transition-colors ${authMode === 'admin' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-blue-400'}`}
            >
              <Shield size={14} /> Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {authMode === 'admin' ? 'Username' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  {authMode === 'admin' ? <Shield size={18} /> : <Mail size={18} />}
                </div>
                <input 
                  type={authMode === 'admin' ? 'text' : 'email'} 
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={authMode === 'admin' ? 'admin_username' : 'name@example.com'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50
                ${authMode === 'admin' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-500'}
              `}
            >
              {loading ? 'Processing...' : (authMode === 'signup' ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {authMode !== 'admin' && (
            <>
              <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button 
                  onClick={handleGoogle}
                  className="px-4 py-2 flex items-center justify-center gap-2 bg-gray-950 border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-sm font-medium">Google</span>
                </button>
                <button 
                  onClick={handlePhone}
                  className="px-4 py-2 flex items-center justify-center gap-2 bg-gray-950 border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Phone className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium">Mobile</span>
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
