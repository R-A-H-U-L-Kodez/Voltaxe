import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AuthContextType } from '../types';
import axios from 'axios';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('token');
  });

  // Initialize theme on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('voltaxe_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const theme = parsed.theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (error) {
        console.error('Failed to load theme:', error);
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      // Call the real login API
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      // Store the real JWT token
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('voltaxe_token', access_token); // Keep for backward compatibility
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.detail || 'Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('voltaxe_token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
