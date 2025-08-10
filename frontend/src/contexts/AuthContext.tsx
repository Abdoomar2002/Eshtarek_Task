import React, { createContext, useContext, useReducer, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import toast from 'react-hot-toast';

import { api } from '../services/api.ts';

// Types
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'tenant_admin' | 'user';
  is_tenant_admin: boolean;
  tenant_id?: number;
  tenant_name?: string;
}

interface AuthState {
  user: User | null;
  tokens: {
    access: string;
    refresh: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  tenant_name?: string;
}

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
};

// Action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: { access: string; refresh: string } } }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: { access: string; refresh: string } }
  | { type: 'UPDATE_USER'; payload: User };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'REFRESH_TOKEN':
      return {
        ...state,
        tokens: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp ? decoded.exp < currentTime : true;
    } catch {
      return true;
    }
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const tokens = localStorage.getItem('tokens');
      const user = localStorage.getItem('user');

      if (tokens && user) {
        try {
          const parsedTokens = JSON.parse(tokens);
          const parsedUser = JSON.parse(user);

          // Check if access token is expired
          if (isTokenExpired(parsedTokens.access)) {
            // Try to refresh token
            try {
              await refreshToken();
            } catch {
              // If refresh fails, logout
              logout();
            }
          } else {
            // Token is valid, restore state
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user: parsedUser, tokens: parsedTokens },
            });
          }
        } catch (error) {
          console.error('Error parsing stored auth data:', error);
          logout();
        }
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    initializeAuth();
  }, []);

  // Save auth data to localStorage
  useEffect(() => {
    if (state.tokens && state.user) {
      localStorage.setItem('tokens', JSON.stringify(state.tokens));
      localStorage.setItem('user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('tokens');
      localStorage.removeItem('user');
    }
  }, [state.tokens, state.user]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await api.post('/auth/login/', { email, password });
      const { user, tokens } = response.data;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens },
      });

      toast.success('Login successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await api.post('/auth/register/', userData);
      const { user, tokens } = response.data;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens },
      });

      toast.success('Registration successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  // Refresh token function
  const refreshToken = async () => {
    if (!state.tokens?.refresh) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post('/auth/token/refresh/', {
        refresh: state.tokens.refresh,
      });

      const newTokens = {
        access: response.data.access,
        refresh: state.tokens.refresh, // Keep the same refresh token
      };

      dispatch({
        type: 'REFRESH_TOKEN',
        payload: newTokens,
      });

      return newTokens;
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      throw error;
    }
  };

  // Update user function
  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 