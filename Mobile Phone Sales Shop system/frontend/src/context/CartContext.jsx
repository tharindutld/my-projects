import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const { token, user, API_URL } = useAuth();

  const fetchCart = async () => {
    if (!token || (user && user.role !== 'Customer')) {
      setCartItems([]);
      setCartCount(0);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data);
        const count = data.reduce((acc, item) => acc + item.Quantity, 0);
        setCartCount(count);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token, user]);

  const addToCart = async (variantId, qty = 1) => {
    if (!token) {
      throw new Error('Please login to add items to your cart.');
    }

    const res = await fetch(`${API_URL}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ variantId, qty })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error adding to cart');
    }

    await fetchCart();
    return data.message;
  };

  const updateCartQty = async (orderId, qty) => {
    const res = await fetch(`${API_URL}/cart/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ qty })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error updating cart');
    }

    await fetchCart();
    return data.message;
  };

  const removeFromCart = async (orderId) => {
    const res = await fetch(`${API_URL}/cart/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error removing item');
    }

    await fetchCart();
    return data.message;
  };

  const getCartSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.discountedPrice * item.Quantity, 0);
  };

  const getCartOriginalSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.price * item.Quantity, 0);
  };

  const getCartSavings = () => {
    return getCartOriginalSubtotal() - getCartSubtotal();
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      fetchCart,
      addToCart,
      updateCartQty,
      removeFromCart,
      getCartSubtotal,
      getCartOriginalSubtotal,
      getCartSavings
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
