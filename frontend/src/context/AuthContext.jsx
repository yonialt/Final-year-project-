import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../lib/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token,  setToken]  = useState(localStorage.getItem('jwt') || null);
  const [user,   setUser]   = useState(null);
  const [loading,setLoading]= useState(true);

  // Verify token and load profile on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await API.get('/auth/me');
          setUser(res.data.data.user);
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('jwt', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated:!!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
