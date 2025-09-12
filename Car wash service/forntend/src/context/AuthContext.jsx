// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  const refreshAuth = () => {
    const token = localStorage.getItem('jwtToken');
    const name = localStorage.getItem('userName');
    setIsLoggedIn(!!token);
    setUserName(name || '');
  };

  useEffect(() => {
    refreshAuth();

    const syncAuthAcrossTabs = () => refreshAuth();
    window.addEventListener('storage', syncAuthAcrossTabs);

    return () => {
      window.removeEventListener('storage', syncAuthAcrossTabs);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userName, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
