import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
  const { token, loading: authLoading, API_URL } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleRemove = async (productId) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Item removed from wishlist.');
        fetchWishlist();
      } else {
        setError('Failed to remove item.');
      }
    } catch (err) {
      setError('Error communicating with backend.');
    }
  };

  const handleAddToCart = async (variantId) => {
    setError('');
    setSuccess('');
    if (!variantId) {
      setError('Please select a specific variant configuration from the product details page.');
      return;
    }
    try {
      const msg = await addToCart(variantId, 1);
      setSuccess(msg);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', padding: '100px' }}>Loading bookmarks...</div>;
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
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
          {wishlistItems.map((item) => (
            <div key={item.WishlistID} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '180px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '50px' }}>📱</span>
                
                <button
                  onClick={() => handleRemove(item.ProductId)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: 'var(--danger)',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer'
                  }}
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
                  <div style={{ fontWeight: '800', fontSize: '16px' }}>
                    Rs. {parseFloat(item.Price || 0).toLocaleString('en-US')}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                    <button
                      onClick={() => handleAddToCart(item.VariantId)}
                      disabled={!item.VariantId}
                      className="glass-btn"
                      style={{ fontSize: '13px', padding: '10px', borderRadius: '8px' }}
                    >
                      Quick Add <ShoppingCart size={14} />
                    </button>
                    
                    <Link to={`/product/${item.ProductId}`} className="glass-btn glass-btn-secondary" style={{ fontSize: '13px', padding: '10px', borderRadius: '8px' }}>
                      Specs
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
