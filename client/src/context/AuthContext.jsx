import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUser();

      // Initialize Socket
      const socketUrl = window.location.origin;
      const newSocket = io(socketUrl, {
          auth: { token }
      });
      setSocket(newSocket);

      return () => {
          newSocket.disconnect();
      };
    } else {
      localStorage.removeItem('token');
      setLoading(false);
      if (socket) {
          socket.disconnect();
          setSocket(null);
      }
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me'); // Updated to match api.js endpoints
      setUser(res.data.user);
    } catch (err) {
      console.error(err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (username, password) => {
    const res = await api.post('/auth/register', { username, password });
    setToken(res.data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
      await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, socket, login, register, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
