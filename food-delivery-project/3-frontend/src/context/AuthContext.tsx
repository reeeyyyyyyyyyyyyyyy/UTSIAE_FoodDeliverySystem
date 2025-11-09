import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, userAPI } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await authAPI.login({ email, password });
      console.log('✅ Login response:', response);
      
      if (response.status === 'success' && response.data?.token) {
        const token = response.data.token;
        console.log('🔑 Token received, length:', token.length);
        setToken(token);
        localStorage.setItem('token', token);

        // Fetch user profile - retry if needed
        let retries = 3;
        let profileSuccess = false;
        
        while (retries > 0 && !profileSuccess) {
          try {
            // Wait a bit for token to be set in interceptor
            await new Promise(resolve => setTimeout(resolve, 200));
            
            console.log('📋 Fetching user profile...');
            const profileResponse = await userAPI.getProfile();
            console.log('✅ Profile response:', profileResponse);
            
            if (profileResponse.status === 'success' && profileResponse.data) {
              const userData = profileResponse.data;
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              console.log('✅ User logged in successfully:', userData);
              profileSuccess = true;
            }
          } catch (error: any) {
            console.warn(`⚠️ Profile fetch attempt ${4 - retries} failed:`, error.message);
            retries--;
            if (retries === 0) {
              // Create minimal user object if all retries fail
              console.warn('⚠️ Using minimal user data');
              const minimalUser = {
                id: 0,
                name: email.split('@')[0],
                email: email,
              };
              setUser(minimalUser);
              localStorage.setItem('user', JSON.stringify(minimalUser));
            }
          }
        }
      } else {
        console.error('❌ Login failed - no token in response');
        throw new Error(response.message || 'Login failed - no token received');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const response = await authAPI.register({ name, email, password, phone });
      if (response.status === 'success') {
        // Auto login after registration
        await login(email, password);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
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

