import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!token) {
        if (isMounted) {
          setUser(null);
          localStorage.removeItem('user');
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          const fetchedUser = {
            id: data.ID || data.id,
            firstName: data.FirstName || data.first_name,
            lastName: data.LastName || data.last_name,
            email: data.Email || data.email,
            mobileNumber: data.MobileNumber || data.phone,
            role: data.role || 'Customer',
            loyaltyPoints: data.LoyaltyPoints || 0
          };
          if (isMounted) {
            setUser(fetchedUser);
            localStorage.setItem('user', JSON.stringify(fetchedUser));
          }
        } else if (res.status === 401 || res.status === 403) {
          if (isMounted) logout();
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const staffLogin = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Staff login failed');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (firstname, lastname, email, mobilenumber, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstname, lastname, email, mobilenumber, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data.message;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Profile update failed');
    }

    const profileRes = await fetch(`${API_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (profileRes.ok) {
      const updatedData = await profileRes.json();
      const updatedUser = {
        id: updatedData.ID || updatedData.id,
        firstName: updatedData.FirstName || updatedData.first_name,
        lastName: updatedData.LastName || updatedData.last_name,
        email: updatedData.Email || updatedData.email,
        mobileNumber: updatedData.MobileNumber || updatedData.phone,
        role: updatedData.role || 'Customer',
        loyaltyPoints: updatedData.LoyaltyPoints || 0
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    return data.message;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, staffLogin, register, logout, updateProfile, API_URL }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
