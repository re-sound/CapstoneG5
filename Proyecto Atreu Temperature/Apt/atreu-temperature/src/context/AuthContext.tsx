import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { hashPasswordWithUserSalt, isWebCryptoAvailable } from '../utils/hash';

interface User {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role_id: number;
  last_login?: string;
  last_logout?: string;
}

interface Session {
  token: string;
  login_time: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (user_id: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'http://localhost:4000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay una sesión guardada al cargar la app
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      validateSession(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const validateSession = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSession({
          token,
          login_time: data.session.login_time
        });
      } else {
        // Token inválido, limpiar datos
        localStorage.removeItem('auth_token');
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Error validando sesión:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (user_id: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Hashear la contraseña antes de enviarla usando salt con user_id
      let hashedPassword = password;
      if (isWebCryptoAvailable()) {
        hashedPassword = await hashPasswordWithUserSalt(password, user_id);
        console.log('🔐 [FRONTEND] Password original:', password);
        console.log('🔐 [FRONTEND] Password hasheada con SHA-256 + salt:', hashedPassword);
        console.log('🔐 [FRONTEND] Longitud del hash:', hashedPassword.length);
      } else {
        console.warn('⚠️ [FRONTEND] Web Crypto API no disponible, enviando contraseña sin hashear');
      }
      
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id, password: hashedPassword })
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setSession(data.session);
        localStorage.setItem('auth_token', data.session.token);
        return true;
      } else {
        console.error('Error de login:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (session?.token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.token}`
          }
        });
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar datos locales independientemente del resultado del servidor
      localStorage.removeItem('auth_token');
      setUser(null);
      setSession(null);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!session
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}