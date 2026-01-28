import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
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
      delete axios.defaults.headers.common['x-auth-token'];
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
      const res = await axios.get('/api/auth/user');
      setUser(res.data);
    } catch (err) {
      console.error(err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password });
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (username, password) => {
    const res = await axios.post('/api/auth/register', { username, password });
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
