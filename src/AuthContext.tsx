import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getUserById } from './services/userService'; // Assumindo que você tem uma função para buscar usuário por ID

interface AuthContextType {
  user: FirebaseUser | null;
  setUser: (user: FirebaseUser | null) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userData = await getUserById(firebaseUser.uid);
          setIsAdmin(userData?.isAdmin || false);
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isAdmin, setIsAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};