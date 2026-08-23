import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
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
          setUser({
            id: data.ID || data.id,
            firstName: data.FirstName || data.first_name,
            lastName: data.LastName || data.last_name,
            email: data.Email || data.email,
            mobileNumber: data.MobileNumber || data.phone,
            role: data.role || 'Customer',
            loyaltyPoints: data.LoyaltyPoints || 0
          });
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const delayTimer = setTimeout(() => {
      fetchProfile();
    }, 100);

    return () => clearTimeout(delayTimer);
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
    setToken(data.token);
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
    setToken(data.token);
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

    // Refresh profile state
    const profileRes = await fetch(`${API_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (profileRes.ok) {
      const updatedData = await profileRes.json();
      setUser({
        id: updatedData.ID || updatedData.id,
        firstName: updatedData.FirstName || updatedData.first_name,
        lastName: updatedData.LastName || updatedData.last_name,
        email: updatedData.Email || updatedData.email,
        mobileNumber: updatedData.MobileNumber || updatedData.phone,
        role: updatedData.role || 'Customer',
        loyaltyPoints: updatedData.LoyaltyPoints || 0
      });
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
