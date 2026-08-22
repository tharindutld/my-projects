import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check user session on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          // Load watchlist
          const wlRes = await api.get('/watchlist');
          setWatchlist(wlRes.data);
        } catch (err) {
          console.error('Session restore failed:', err);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // Login action
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      
      // Load watchlist
      const wlRes = await api.get('/watchlist');
      setWatchlist(wlRes.data);
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Invalid credentials' 
      };
    }
  };

  // Register action
  const register = async (username, email, password) => {
    try {
      const res = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setWatchlist([]);
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Registration failed' 
      };
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setWatchlist([]);
  };

  // Fetch Watchlist manually if needed
  const fetchWatchlist = async () => {
    if (!user) return;
    try {
      const res = await api.get('/watchlist');
      setWatchlist(res.data);
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    }
  };

  // Add a movie to watchlist
  const addToWatchlist = async (movie) => {
    if (!user) return false;
    
    // Normalize format
    const movieData = {
      movie_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average
    };

    try {
      await api.post('/watchlist', movieData);
      setWatchlist(prev => [...prev, movieData]);
      return true;
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
      return false;
    }
  };

  // Remove a movie from watchlist
  const removeFromWatchlist = async (movieId) => {
    if (!user) return false;
    try {
      await api.delete(`/watchlist/${movieId}`);
      setWatchlist(prev => prev.filter(item => item.movie_id !== movieId));
      return true;
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
      return false;
    }
  };

  // Check if a movie is watchlisted
  const isInWatchlist = (movieId) => {
    return watchlist.some(item => Number(item.movie_id) === Number(movieId));
  };

  return (
    <AuthContext.Provider value={{
      user,
      watchlist,
      loading,
      login,
      register,
      logout,
      fetchWatchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist
    }}>
      {children}
    </AuthContext.Provider>
  );
};
