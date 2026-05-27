import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  User, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const checkLocalAdmin = () => {
      if (localStorage.getItem('admin_session') === 'true') {
        setUser({ uid: 'mock_admin_uid', email: 'sajid_dev@admin.com' } as User);
        setIsAdmin(true);
        setLoading(false);
        return true;
      }
      return false;
    };

    if (checkLocalAdmin()) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (localStorage.getItem('admin_session') === 'true') return;

      setUser(currentUser);
      if (currentUser) {
        // check if admin
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
        if ((currentUser.email === 'unofficial_sajid@admin.com' || currentUser.email === 'sajid_dev@admin.com') && !adminDoc.exists()) {
           try {
             await setDoc(doc(db, 'admins', currentUser.uid), {
               username: currentUser.email.split('@')[0],
               createdAt: Date.now()
             });
             setIsAdmin(true);
           } catch {
             setIsAdmin(true); // Fallback if creation fails but they have the email
           }
        } else {
           setIsAdmin(adminDoc.exists() || currentUser.email === 'unofficial_sajid@admin.com' || currentUser.email === 'sajid_dev@admin.com');
        }
        
        // auto create user doc if not exists
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', currentUser.uid), {
            email: currentUser.email || '',
            createdAt: Date.now()
          });
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const { googleProvider } = await import('../firebase');
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    localStorage.removeItem('admin_session');
    setIsAdmin(false);
    setUser(null);
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, loginWithGoogle, logout, isAuthModalOpen, setAuthModalOpen }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
