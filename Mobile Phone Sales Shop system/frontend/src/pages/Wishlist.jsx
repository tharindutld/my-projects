import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ConfirmModal from '../components/ConfirmModal';

const IMAGE_BASE = 'http://localhost:5000/uploads/products/';

export default function Wishlist() {
  const { token, loading: authLoading, API_URL } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'danger',
    onConfirm: null
  });

  const fetchWishlist = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchWishlist();
  }, [token, authLoading]);

  const showSuccessMsg = (msg) => {
    setSuccess(msg);
    setTimeout(() => {
      setSuccess('');
    }, 2500);
  };

  const showErrorMsg = (msg) => {
    setError(msg);
    setTimeout(() => {
      setError('');
    }, 3000);
  };

  const requestRemove = (item) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Bookmark',
      message: `Are you sure you want to remove "${item.ProductName}" from your wishlist?`,
      confirmText: 'Remove',
      variant: 'danger',
      onConfirm: () => handleRemove(item)
    });
  };

  const handleRemove = async (item) => {
    setError('');
    setSuccess('');
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      const wishId = item.WishID || item.WishlistID || item.ID;
      const prodId = item.PID || item.ProductId;
      const endpoint = wishId ? `${API_URL}/wishlist/${wishId}` : `${API_URL}/wishlist/product/${prodId}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showSuccessMsg('Item removed from wishlist.');
        fetchWishlist();
      } else {
        showErrorMsg('Failed to remove item.');
      }
    } catch (err) {
      showErrorMsg('Error communicating with backend.');
    }
  };

  const handleAddToCart = async (variantId) => {
    setError('');
    setSuccess('');
    if (!variantId) {
      showErrorMsg('Please select a specific variant configuration from the product details page.');
      return;
    }
    try {
      const msg = await addToCart(variantId, 1);
      showSuccessMsg(msg || 'Added to cart successfully!');
    } catch (err) {
      showErrorMsg(err.message);
    }
  };

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', padding: '100px' }}>Loading bookmarks...</div>;
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Heart size={32} className="text-accent" fill="var(--accent)" /> My Bookmarked Items
      </h1>

      {error && <div style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}
      {success && <div style={{ color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{success}</div>}

      {wishlistItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>💖</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px' }}>Wishlist is Empty</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Save items to your bookmarks to track stock and price movements.</p>
          <Link to="/products" className="glass-btn" style={{ borderRadius: '24px' }}>
            Browse Catalog <Smartphone size={18} />
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '30px'
        }}>
          {wishlistItems.map((item) => {
            const wishKey = item.WishID || item.WishlistID || item.PID;
            const price = parseFloat(item.MinPrice || item.Price || 0);

            return (
              <div key={wishKey} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: '180px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {item.Image1 ? (
                    <img 
                      src={IMAGE_BASE + item.Image1} 
                      alt={item.ProductName} 
                      style={{ maxHeight: '160px', maxWidth: '90%', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span style={{ fontSize: '50px' }}>📱</span>
                  )}
                  
                  <button
                    onClick={() => requestRemove(item)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: 'var(--danger)',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      zIndex: 3
                    }}
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                    {item.BrandName}
                  </span>
                  <h3 style={{ fontSize: '17px', fontWeight: '700' }}>{item.ProductName}</h3>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#06b6d4' }}>
                      {price > 0 ? `Rs. ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Price on request'}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                      <button
                        onClick={() => handleAddToCart(item.VariantId)}
                        className="glass-btn"
                        style={{ fontSize: '13px', padding: '10px', borderRadius: '8px' }}
                      >
                        Quick Add <ShoppingCart size={14} />
                      </button>
                      
                      <Link to={`/product/${item.PID || item.ProductId}`} className="glass-btn glass-btn-secondary" style={{ fontSize: '13px', padding: '10px', borderRadius: '8px', textDecoration: 'none' }}>
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
