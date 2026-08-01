import React, { createContext, useState, useEffect, useContext } from 'react';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/storage';
import api from '../services/api';

import { registerForPushNotificationsAsync } from '../services/notificationService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await getItemAsync('token');
        const storedUser = await getItemAsync('user');
        
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
          // Register for push notifications since we have a valid session
          registerForPushNotificationsAsync();
        }
      } catch (error) {
        console.log('Failed to load user info', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { data } = res.data;
      await setItemAsync('token', data.token);
      await setItemAsync('user', JSON.stringify(data));
      setUser(data);
      registerForPushNotificationsAsync();
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { data } = res.data;
      await setItemAsync('token', data.token);
      await setItemAsync('user', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await deleteItemAsync('token');
      await deleteItemAsync('user');
      setUser(null);
    } catch (error) {
      console.log('Logout error', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
