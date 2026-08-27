import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Heart, Flame, Shield, ArrowLeft, 
  Palette, Cpu, HardDrive, Smartphone, Camera, Tv, 
  ChevronRight, Home, CheckCircle2, List 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const IMAGE_BASE = 'http://localhost:5000/uploads/products/';

function ProductImage({ src, alt }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (!src || imgError) {
    return <span style={{ fontSize: '120px' }}>📱</span>;
  }
  return (
    <img
      src={IMAGE_BASE + src}
      alt={alt}
      onError={() => setImgError(true)}
      style={{ maxHeight: '320px', maxWidth: '100%', objectFit: 'contain' }}
    />
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, API_URL } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [activeTab, setActiveTab] = useState('features'); // 'features' | 'specs'
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wishlisted, setWishlisted] = useState(false);

  const successTimerRef = useRef(null);
  const errorTimerRef = useRef(null);

  const showSuccessMsg = (msg) => {
    setSuccess(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const showErrorMsg = (msg) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setError('');
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) {
          throw new Error('Product not found');
        }
        const data = await res.json();
        setProduct(data);
        setActiveImage(data.Image1 || '');
        setVariants(data.variants || []);
        if (data.variants && data.variants.length > 0) {
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
  }, [id, token, API_URL]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setError('');
    setSuccess('');
    try {
      const msg = await addToCart(selectedVariant.ID, quantity);
      showSuccessMsg(msg || 'Added to cart successfully!');
    } catch (err) {
      showErrorMsg(err.message || 'Failed to add item to cart.');
    }
  };

  const handleToggleWishlist = async () => {
    if (!token) {
      showErrorMsg('Please login to add items to your wishlist.');
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
          showSuccessMsg('Removed from wishlist.');
        } else {
          showErrorMsg('Failed to remove from wishlist.');
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
          showSuccessMsg('Added to wishlist successfully!');
        } else {
          showErrorMsg('Failed to add to wishlist.');
        }
      }
    } catch (err) {
      showErrorMsg('Error updating wishlist.');
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

  // Build array of valid images for the 3-image gallery
  const productImages = [product.Image1, product.Image2, product.Image3].filter(
    img => img && typeof img === 'string' && img.trim() !== ''
  );

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Breadcrumbs Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
          <Home size={15} /> Home
        </button>
        <ChevronRight size={14} />
        <button onClick={() => navigate('/products')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
          Shop
        </button>
        <ChevronRight size={14} />
        <span style={{ color: '#fff', fontWeight: '600' }}>{product.ProductName}</span>
      </nav>

      <button onClick={() => navigate(-1)} className="glass-btn glass-btn-secondary" style={{ marginBottom: '30px', borderRadius: '20px' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px'
      }}>
        {/* Gallery / 3-Image Display Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '360px',
            background: 'rgba(255,255,255,0.01)',
            position: 'relative',
            borderRadius: '20px',
            padding: '20px'
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
                gap: '6px',
                zIndex: 2
              }}>
                <Flame size={14} /> {product.DiscountPercent}% OFF PROMO
              </div>
            )}
            <ProductImage src={activeImage || product.Image1} alt={product.ProductName} />
          </div>

          {/* 3 Thumbnails Selector Row */}
          {productImages.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
              {productImages.map((img, idx) => {
                const isActive = (activeImage || product.Image1) === img;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    style={{
                      width: '82px',
                      height: '82px',
                      borderRadius: '14px',
                      border: isActive ? '2.5px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(15, 23, 42, 0.65)',
                      padding: '6px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.25s ease',
                      boxShadow: isActive ? '0 0 16px rgba(99, 102, 241, 0.6)' : 'none',
                      transform: isActive ? 'scale(1.05)' : 'scale(1)'
                    }}
                    title={`View photo ${idx + 1}`}
                  >
                    <img
                      src={IMAGE_BASE + img}
                      alt={`${product.ProductName} photo ${idx + 1}`}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </button>
                );
              })}
            </div>
          )}
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

          {/* Comprehensive Specifications List (Matching legacy single.php) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            fontSize: '14px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '18px',
            borderRadius: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Palette size={16} style={{ color: '#06b6d4' }} />
              <span><strong>Color:</strong> {selectedVariant?.Color || 'Unspecified'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={16} style={{ color: '#06b6d4' }} />
              <span><strong>RAM:</strong> {selectedVariant?.RAM || 'Unspecified'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HardDrive size={16} style={{ color: '#06b6d4' }} />
              <span><strong>Storage:</strong> {selectedVariant?.ROM || 'Unspecified'}</span>
            </div>
            {product.SimType && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={16} style={{ color: '#06b6d4' }} />
                <span><strong>SIM Support:</strong> {product.SimType}</span>
              </div>
            )}
            {product.Processor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={16} style={{ color: '#06b6d4' }} />
                <span><strong>Processor:</strong> {product.Processor}</span>
              </div>
            )}
            {product.Display && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Tv size={16} style={{ color: '#06b6d4' }} />
                <span><strong>Display:</strong> {product.Display}</span>
              </div>
            )}
            {product.FrontCamera && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Camera size={16} style={{ color: '#06b6d4' }} />
                <span><strong>Camera:</strong> {product.FrontCamera}</span>
              </div>
            )}
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

          {/* Pricing & Stock (With Vibrant High-Contrast Stock Badge) */}
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
              <span style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '800',
                letterSpacing: '0.3px',
                background: selectedVariant?.Stock > 0 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                boxShadow: selectedVariant?.Stock > 0 
                  ? '0 4px 12px rgba(16, 185, 129, 0.4)' 
                  : '0 4px 12px rgba(239, 68, 68, 0.4)',
                display: 'inline-block'
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

      {/* Lower Section: Key Features & Technical Specifications Tabs (Matching single.php) */}
      <div className="glass-panel" style={{ marginTop: '45px', padding: '30px', borderRadius: '24px' }}>
        <div style={{
          display: 'flex',
          gap: '15px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '15px',
          marginBottom: '25px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`glass-btn ${activeTab === 'features' ? '' : 'glass-btn-secondary'}`}
            style={{
              padding: '10px 24px',
              borderRadius: '20px',
              fontSize: '15px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={18} /> Key Features
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`glass-btn ${activeTab === 'specs' ? '' : 'glass-btn-secondary'}`}
            style={{
              padding: '10px 24px',
              borderRadius: '20px',
              fontSize: '15px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <List size={18} /> Technical Specifications
          </button>
        </div>

        <div>
          {activeTab === 'features' ? (
            <div style={{ lineHeight: '1.8', color: '#e2e8f0', fontSize: '15px', whiteSpace: 'pre-line' }}>
              {product.KeyFeature && product.KeyFeature.trim() !== '' ? (
                product.KeyFeature
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No key features specified for this mobile model.</p>
              )}
            </div>
          ) : (
            <div style={{ lineHeight: '1.8', color: '#e2e8f0', fontSize: '15px', whiteSpace: 'pre-line' }}>
              {product.Specification && product.Specification.trim() !== '' ? (
                product.Specification
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No additional technical specifications provided for this model.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
