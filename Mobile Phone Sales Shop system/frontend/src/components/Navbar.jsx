import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut, Search, Settings, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ConfirmModal from './ConfirmModal';

export default function Navbar() {
  const { user, token, logout, API_URL } = useAuth();
  const { cartCount } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  // Ref to handle outside click to close dropdown
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(12px)'
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

              {/* Wishlist Icon */}
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

              {/* Cart Icon */}
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

          {/* Profile Dropdown (With outside-click listener ref) */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)} 
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px',
                borderRadius: '50%'
              }}
              aria-expanded={dropdownOpen}
              title="My Account Menu"
            >
              <User size={22} />
            </button>

            {dropdownOpen && (
              <div className="glass-card animate-fade-in" style={{
                position: 'absolute',
                right: 0,
                top: '45px',
                width: '210px',
                padding: '12px',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
              }}>
                {user ? (
                  <>
                    {user.role === 'Customer' ? (
                      <>
                        <Link 
                          to="/profile" 
                          onClick={() => setDropdownOpen(false)} 
                          className="dropdown-nav-link"
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        >
                          <User size={18} /> My Account
                        </Link>
                        <Link 
                          to="/my-orders" 
                          onClick={() => setDropdownOpen(false)} 
                          className="dropdown-nav-link"
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        >
                          <Package size={18} /> My Orders
                        </Link>
                      </>
                    ) : (
                      <Link 
                        to="/admin" 
                        onClick={() => setDropdownOpen(false)} 
                        className="dropdown-nav-link"
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#818cf8'
                        }}
                      >
                        <Settings size={18} /> Admin Panel
                      </Link>
                    )}

                    <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.12)', margin: '4px 0' }} />

                    <button 
                      onClick={() => { setDropdownOpen(false); setShowLogoutModal(true); }} 
                      className="dropdown-logout-btn"
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '1px solid transparent',
                        width: '100%',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setDropdownOpen(false)} style={{
                      padding: '10px',
                      borderRadius: '10px',
                      display: 'block',
                      fontSize: '14px',
                      textAlign: 'center'
                    }} className="glass-btn">Customer Login</Link>
                    <Link to="/login?staff=true" onClick={() => setDropdownOpen(false)} style={{
                      padding: '10px',
                      borderRadius: '10px',
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

      {/* Dropdown & Responsive Styles */}
      <style>{`
        .dropdown-nav-link {
          transition: all 0.2s ease-in-out;
          color: #cbd5e1 !important;
        }

        .dropdown-nav-link:hover {
          background: rgba(99, 102, 241, 0.2) !important;
          color: #ffffff !important;
          border-color: rgba(99, 102, 241, 0.35) !important;
        }

        .dropdown-logout-btn {
          transition: all 0.2s ease-in-out;
          color: #f87171 !important;
          background: transparent;
        }

        .dropdown-logout-btn:hover {
          background: rgba(239, 68, 68, 0.25) !important;
          color: #ffffff !important;
          border-color: rgba(239, 68, 68, 0.5) !important;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
        }

        @media (min-width: 768px) {
          .md\\:flex { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
