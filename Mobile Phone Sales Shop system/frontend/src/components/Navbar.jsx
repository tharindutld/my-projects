import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut, Search, Menu, X, Settings, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ConfirmModal from './ConfirmModal';

export default function Navbar() {
  const { user, token, logout, API_URL } = useAuth();
  const { cartCount } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const fetchWishlistCount = async () => {
    if (!token || (user && user.role !== 'Customer')) {
      setWishlistCount(0);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistCount(data.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWishlistCount();
    const interval = setInterval(fetchWishlistCount, 15000);
    return () => clearInterval(interval);
  }, [token, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderRadius: '0 0 16px 16px',
      margin: '0 0 20px 0',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      background: 'rgba(15, 23, 42, 0.65)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px'
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '24px',
            fontWeight: '800',
            background: 'linear-gradient(90deg, #ec4899, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px'
          }}>MobileMart</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} style={{
          display: 'none',
          alignItems: 'center',
          position: 'relative',
          width: '300px'
        }} className="md:flex">
          <input
            type="text"
            placeholder="Search phones, brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input"
            style={{
              width: '100%',
              paddingRight: '40px',
              paddingTop: '8px',
              paddingBottom: '8px',
              borderRadius: '24px',
              fontSize: '14px'
            }}
          />
          <button type="submit" style={{
            position: 'absolute',
            right: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}>
            <Search size={18} />
          </button>
        </form>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/products" className="glass-btn-secondary" style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>Browse Catalog</Link>

          {(!user || user.role === 'Customer') && (
            <>
              {/* My Orders Direct Icon Link */}
              {user && user.role === 'Customer' && (
                <Link to="/my-orders" style={{ position: 'relative', color: 'var(--text-primary)' }} title="My Orders">
                  <Package size={22} style={{ transition: 'var(--transition)' }} />
                </Link>
              )}

              {/* Wishlist */}
              <Link to="/wishlist" style={{ position: 'relative', color: 'var(--text-primary)' }} title="Wishlist">
                <Heart size={22} style={{ transition: 'var(--transition)' }} />
                {wishlistCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--accent)',
                    color: '#fff',
                    borderRadius: '50%',
                    fontSize: '10px',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>{wishlistCount}</span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/cart" style={{ position: 'relative', color: 'var(--text-primary)' }} title="Cart">
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--primary)',
                    color: '#fff',
                    borderRadius: '50%',
                    fontSize: '10px',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>{cartCount}</span>
                )}
              </Link>
            </>
          )}

          {/* Profile Dropdown */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <User size={22} />
            </button>

            {dropdownOpen && (
              <div className="glass-card" style={{
                position: 'absolute',
                right: 0,
                top: '40px',
                width: '200px',
                padding: '10px',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'rgba(15, 23, 42, 0.95)'
              }}>
                {user ? (
                  <>
                    {user.role === 'Customer' ? (
                      <>
                        <Link to="/profile" onClick={() => setDropdownOpen(false)} style={{
                          padding: '8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px'
                        }}>
                          <User size={16} /> My Account
                        </Link>
                        <Link to="/my-orders" onClick={() => setDropdownOpen(false)} style={{
                          padding: '8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px'
                        }}>
                          <Package size={16} /> My Orders
                        </Link>
                        <Link to="/wishlist" onClick={() => setDropdownOpen(false)} style={{
                          padding: '8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px'
                        }}>
                          <Heart size={16} /> Wishlist
                        </Link>
                      </>
                    ) : (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)} style={{
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: 'var(--primary)'
                      }}>
                        <Settings size={16} /> Admin Panel
                      </Link>
                    )}
                    <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                    <button onClick={() => { setDropdownOpen(false); setShowLogoutModal(true); }} style={{
                      padding: '8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger)',
                      width: '100%',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}>
                      <LogOut size={16} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setDropdownOpen(false)} style={{
                      padding: '8px',
                      borderRadius: '8px',
                      display: 'block',
                      fontSize: '14px',
                      textAlign: 'center'
                    }} className="glass-btn">Customer Login</Link>
                    <Link to="/login?staff=true" onClick={() => setDropdownOpen(false)} style={{
                      padding: '8px',
                      borderRadius: '8px',
                      display: 'block',
                      fontSize: '14px',
                      textAlign: 'center'
                    }} className="glass-btn-secondary">Staff Portal</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to log out of your session?"
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
          navigate('/');
        }}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Mobile search bar style helper */}
      <style>{`
        @media (min-width: 768px) {
          .md\\:flex { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
