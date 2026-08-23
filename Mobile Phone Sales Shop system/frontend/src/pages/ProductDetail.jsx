import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Flame, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, API_URL } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) {
          throw new Error('Product not found');
        }
        const data = await res.json();
        setProduct(data.product);
        setVariants(data.variants);
        if (data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }

        // Check if item is in wishlist
        if (token) {
          const wishRes = await fetch(`${API_URL}/wishlist`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (wishRes.ok) {
            const wishData = await wishRes.json();
            const isInWishlist = wishData.some(w => w.ProductId === parseInt(id));
            setWishlisted(isInWishlist);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id, token]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setError('');
    setSuccess('');
    try {
      const msg = await addToCart(selectedVariant.ID, quantity);
      setSuccess(msg);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleWishlist = async () => {
    if (!token) {
      setError('Please login to add items to your wishlist.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      if (wishlisted) {
        // Remove from wishlist
        const res = await fetch(`${API_URL}/wishlist/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setWishlisted(false);
          setSuccess('Removed from wishlist.');
        }
      } else {
        // Add to wishlist
        const res = await fetch(`${API_URL}/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId: id })
        });
        if (res.ok) {
          setWishlisted(true);
          setSuccess('Added to wishlist.');
        }
      }
    } catch (err) {
      setError('Error updating wishlist.');
    }
  };

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', padding: '100px' }}>Loading specifications...</div>;
  }

  if (error && !product) {
    return (
      <div className="container" style={{ padding: '60px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '20px' }}>{error}</h3>
        <button onClick={() => navigate('/')} className="glass-btn"><ArrowLeft size={16} /> Back to Catalog</button>
      </div>
    );
  }

  // Calculate pricing
  const isPromo = product.discountActive;
  const originalPrice = selectedVariant ? parseFloat(selectedVariant.Price) : 0;
  const discountedPrice = isPromo ? originalPrice * (1 - parseFloat(product.DiscountPercent) / 100) : originalPrice;

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      <button onClick={() => navigate(-1)} className="glass-btn glass-btn-secondary" style={{ marginBottom: '30px', borderRadius: '20px' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px'
      }}>
        {/* Gallery/Display Panel */}
        <div className="glass-panel" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          background: 'rgba(255,255,255,0.01)',
          position: 'relative'
        }}>
          {isPromo && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'linear-gradient(45deg, #ef4444, #ec4899)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Flame size={14} /> {product.DiscountPercent}% OFF PROMO
            </div>
          )}
          <span style={{ fontSize: '150px' }}>📱</span>
        </div>

        {/* Configurations Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              {product.BrandName} &bull; {product.CategoryName}
            </span>
            <h1 style={{ fontSize: '36px', fontWeight: '800', margin: '5px 0' }}>{product.ProductName}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Model: {product.ModelNumber}</p>
          </div>

          {/* Specs List */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            fontSize: '14px',
            background: 'rgba(255,255,255,0.02)',
            padding: '16px',
            borderRadius: '12px'
          }}>
            <div><strong>Display:</strong> {product.Display || 'Unspecified'}</div>
            <div><strong>Sim Type:</strong> {product.SimType || 'Unspecified'}</div>
          </div>

          {/* Variants Select */}
          {variants.length > 0 && (
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '10px' }}>Select Configuration:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {variants.map(v => (
                  <button
                    key={v.ID}
                    onClick={() => setSelectedVariant(v)}
                    className={`glass-btn ${selectedVariant?.ID === v.ID ? '' : 'glass-btn-secondary'}`}
                    style={{
                      borderRadius: '12px',
                      padding: '10px 16px',
                      fontSize: '13px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontWeight: '700' }}>{v.Color}</span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>{v.ROM} / {v.RAM} RAM</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pricing & Stock */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '28px', fontWeight: '800', color: isPromo ? 'var(--accent)' : 'inherit' }}>
                  Rs. {discountedPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                {isPromo && (
                  <span style={{ fontSize: '16px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                    Rs. {originalPrice.toLocaleString('en-US')}
                  </span>
                )}
              </div>
              {isPromo && (
                <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '4px' }}>
                  Saves Rs. {(originalPrice - discountedPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${selectedVariant?.Stock > 0 ? 'bg-success' : 'bg-danger'}`} style={{
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                background: selectedVariant?.Stock > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: selectedVariant?.Stock > 0 ? 'var(--success)' : 'var(--danger)',
                border: `1px solid ${selectedVariant?.Stock > 0 ? 'var(--success)' : 'var(--danger)'}`
              }}>
                {selectedVariant?.Stock > 0 ? `In Stock (${selectedVariant.Stock} units)` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Alerts */}
          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px' }}>{error}</div>}
          {success && <div style={{ color: 'var(--success)', fontSize: '14px', background: 'rgba(16,185,129,0.1)', padding: '10px', borderRadius: '8px' }}>{success}</div>}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            {selectedVariant?.Stock > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ background: 'none', border: 'none', color: '#fff', width: '40px', height: '100%', cursor: 'pointer' }}
                >
                  -
                </button>
                <span style={{ width: '40px', textAlign: 'center', fontSize: '14px' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant.Stock, quantity + 1))}
                  style={{ background: 'none', border: 'none', color: '#fff', width: '40px', height: '100%', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.Stock === 0}
              className="glass-btn"
              style={{ flexGrow: 1, borderRadius: '8px' }}
            >
              Add to Cart <ShoppingCart size={18} />
            </button>

            <button
              onClick={handleToggleWishlist}
              className="glass-btn glass-btn-secondary"
              style={{ padding: '12px', borderRadius: '8px', color: wishlisted ? 'var(--accent)' : 'inherit' }}
            >
              <Heart size={20} fill={wishlisted ? 'var(--accent)' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
