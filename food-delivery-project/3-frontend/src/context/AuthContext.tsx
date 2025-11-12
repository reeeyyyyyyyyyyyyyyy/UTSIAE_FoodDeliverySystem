import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, userAPI } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  isCustomer: boolean;
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
      
          // Add timeout to login API call
          const loginPromise = authAPI.login({ email, password });
          const loginTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Login request timeout. Please check your connection.')), 3000)
          );
      
      const response = await Promise.race([loginPromise, loginTimeoutPromise]) as any;
      console.log('✅ Login response:', response);
      
      if (response.status === 'success' && response.data?.token) {
        const token = response.data.token;
        console.log('🔑 Token received, length:', token.length);
        setToken(token);
        localStorage.setItem('token', token);

        // Fetch user profile - retry if needed with timeout, but don't block login
        // Login should succeed even if profile fetch fails
        try {
          // Wait a bit for token to be set in interceptor
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('📋 Fetching user profile...');
          
          // Add timeout to profile fetch
          const profilePromise = userAPI.getProfile();
          const profileTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
          );
          
          const profileResponse = await Promise.race([profilePromise, profileTimeoutPromise]) as any;
          console.log('✅ Profile response:', profileResponse);
          
          if (profileResponse.status === 'success' && profileResponse.data) {
            const userData = profileResponse.data;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('✅ User logged in successfully:', userData);
          } else {
            throw new Error('Invalid profile response');
          }
        } catch (error: any) {
          // Profile fetch failed - use minimal user data but don't fail login
          console.warn('⚠️ Profile fetch failed, using minimal user data:', error.message);
          const minimalUser = {
            id: 0,
            name: email.split('@')[0],
            email: email,
          };
          setUser(minimalUser);
          localStorage.setItem('user', JSON.stringify(minimalUser));
          // Login still succeeds with minimal data
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
      console.log('📝 Attempting registration for:', email);
      
      // Add timeout to register API call
      const registerPromise = authAPI.register({ name, email, password, phone });
      const registerTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Registration request timeout. Please check your connection.')), 10000)
      );
      
      const response = await Promise.race([registerPromise, registerTimeoutPromise]) as any;
      console.log('✅ Registration response:', response);
      
      if (response.status === 'success') {
        // Auto login after registration
        console.log('🔄 Auto-login after registration...');
        try {
          await login(email, password);
        } catch (loginError: any) {
          // If auto-login fails, registration still succeeded
          console.warn('⚠️ Auto-login failed after registration:', loginError.message);
          // Don't throw - registration was successful
          // User can manually login later
        }
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAdmin = user?.role === 'admin';
  const isDriver = user?.role === 'driver';
  const isCustomer = !isAdmin && !isDriver;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isDriver,
        isCustomer,
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

