import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI, userAPI } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

interface JWTPayload {
  id: number;
  email: string;
  role: string;
  exp?: number;
  iat?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ role: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ role: string }>;
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
    // Check if user is already logged in from localStorage
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      try {
        // Decode token to get user info
        const decoded = jwtDecode<JWTPayload>(storedToken);
        
        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          // Token expired, remove it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return;
        }
        
        // Set token
        setToken(storedToken);
        
        // Try to get user from localStorage first
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } catch (error) {
            console.error('Failed to parse user data:', error);
            // If parsing fails, create minimal user from token
            const minimalUser: User = {
              id: decoded.id,
              email: decoded.email,
              name: decoded.email.split('@')[0],
              role: decoded.role,
            };
            setUser(minimalUser);
            localStorage.setItem('user', JSON.stringify(minimalUser));
          }
        } else {
          // If no user in localStorage, create minimal user from token
          const minimalUser: User = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.email.split('@')[0],
            role: decoded.role,
          };
          setUser(minimalUser);
          localStorage.setItem('user', JSON.stringify(minimalUser));
        }
        
        // Fetch full user profile in background
        userAPI.getProfile()
          .then((response) => {
            if (response.status === 'success' && response.data) {
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            }
          })
          .catch((error) => {
            console.warn('Failed to fetch user profile on mount:', error);
            // Keep using minimal user from token
          });
      } catch (error) {
        console.error('Failed to decode token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
        
        // Decode token to get user info immediately
        const decoded = jwtDecode<JWTPayload>(token);
        
        // Set token and save to localStorage
        setToken(token);
        localStorage.setItem('token', token);

        // Create minimal user from token immediately
        const minimalUser: User = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.email.split('@')[0],
          role: decoded.role,
        };
        setUser(minimalUser);
        localStorage.setItem('user', JSON.stringify(minimalUser));

        // Fetch full user profile in background
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('📋 Fetching user profile...');
          
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
            // Return role for redirect
            return { role: userData.role || decoded.role };
          }
        } catch (error: any) {
          console.warn('⚠️ Profile fetch failed, using minimal user data from token:', error.message);
          // Login still succeeds with minimal data from token
        }
        
        // Return role from token for redirect
        return { role: decoded.role };
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
          const loginResult = await login(email, password);
          return loginResult; // Return role for redirect
        } catch (loginError: any) {
          // If auto-login fails, registration still succeeded
          console.warn('⚠️ Auto-login failed after registration:', loginError.message);
          // Return default customer role since new registration is always customer
          return { role: 'CUSTOMER' };
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

  // Normalize role to uppercase for comparison
  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === 'ADMIN';
  const isDriver = userRole === 'DRIVER';
  const isCustomer = userRole === 'CUSTOMER' || (!isAdmin && !isDriver);

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

