import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Smartphone, Shield, Truck, Zap, Flame, Award, Heart, ShoppingCart, 
  ChevronLeft, ChevronRight, Layers, ArrowRight, CheckCircle, AlertCircle, Ban, 
  RefreshCw, Headphones, Filter, SlidersHorizontal, Grid, X, ArrowUpDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ConfirmModal from '../components/ConfirmModal';

const IMAGE_BASE = 'http://localhost:5000/uploads/products/';

function ProductImage({ src, alt, isOutOfStock }) {
  const [error, setError] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', overflow: 'hidden' }}>
      {isOutOfStock && (
        <span style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: '#ef4444',
          color: '#ffffff',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '700',
          zIndex: 2,
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
        }}>
          Out of Stock
        </span>
      )}
      {!src || error ? (
        <span style={{ fontSize: '64px', opacity: isOutOfStock ? 0.4 : 1 }}>📱</span>
      ) : (
        <img
          src={IMAGE_BASE + src}
          alt={alt}
          onError={() => setError(true)}
          style={{
            maxHeight: '180px',
            maxWidth: '100%',
            objectFit: 'contain',
            borderRadius: '8px',
            opacity: isOutOfStock ? 0.45 : 1,
            transition: 'transform 0.3s ease'
          }}
        />
      )}
    </div>
  );
}

export default function Home() {
  const { API_URL, token, user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState(null);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  // Wishlist tracking
  const [wishlistIds, setWishlistIds] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    onConfirm: null
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const catalogHeaderRef = useRef(null);

  // Hero Slider state
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = [
    {
      badge: 'New Arrivals',
      badgeColor: '#6366f1',
      title: 'Premium Collection 2026',
      desc: 'Get amazing deals on the latest flagship smartphones & gadgets.',
      btnText: 'Shop Now',
      link: '/products',
      bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.2))'
    },
    {
      badge: 'Sale Offer',
      badgeColor: '#ef4444',
      title: 'Samsung S24 Series',
      desc: 'Experience the future of Galaxy AI in your hands with exclusive discounts.',
      btnText: 'View Deals',
      link: '/products?brand=Samsung',
      bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(236, 72, 153, 0.2))'
    },
    {
      badge: 'iPhone Trade-In',
      badgeColor: '#10b981',
      title: 'Apple iPhone 16 Pro',
      desc: 'Titanium design with A18 Pro chip. Upgrade today with warranty protection.',
      btnText: 'Explore Apple',
      link: '/products?brand=Apple',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(99, 102, 241, 0.2))'
    }
  ];

  // Auto advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Fetch initial data
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        // Fetch brands
        const brandRes = await fetch(`${API_URL}/products/brands`);
        if (brandRes.ok) {
          const brandData = await brandRes.json();
          setBrands(brandData.filter(b => b.Status === 1));
        }

        // Fetch categories
        const catRes = await fetch(`${API_URL}/products/categories`);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.filter(c => c.Status === 1));
        }

        // Fetch products
        const prodRes = await fetch(`${API_URL}/products`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(Array.isArray(prodData) ? prodData : (prodData.products || []));
        }

        // Fetch user wishlist if logged in
        if (token && user?.role === 'Customer') {
          const wishRes = await fetch(`${API_URL}/wishlist`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (wishRes.ok) {
            const wishData = await wishRes.json();
            setWishlistIds(wishData.map(w => w.ProductId));
          }
        }
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, [API_URL, token, user]);

  // Wishlist action with Confirmation Modal
  const requestToggleWishlist = (e, product) => {
    e.stopPropagation();

    if (!token) {
      showToast('Please log in to save items to your wishlist', 'error');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }

    const isSaved = wishlistIds.includes(product.ID);
    const title = isSaved ? 'Remove from Wishlist' : 'Add to Wishlist';
    const message = isSaved 
      ? `Remove "${product.ProductName}" from your wishlist?`
      : `Add "${product.ProductName}" to your wishlist?`;

    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: isSaved ? 'Remove' : 'Add to Wishlist',
      variant: isSaved ? 'danger' : 'primary',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          if (isSaved) {
            const res = await fetch(`${API_URL}/wishlist/${product.ID}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              setWishlistIds(prev => prev.filter(id => id !== product.ID));
              showToast('Removed from wishlist');
            }
          } else {
            const res = await fetch(`${API_URL}/wishlist`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ productId: product.ID })
            });
            if (res.ok) {
              setWishlistIds(prev => [...prev, product.ID]);
              showToast('Added to wishlist! 💖');
            }
          }
        } catch (err) {
          showToast('Error updating wishlist', 'error');
        }
      }
    });
  };

  // Add to Cart action with Confirmation Modal
  const requestAddToCart = (e, product) => {
    e.stopPropagation();

    const variantId = product.MinVariantId || product.minVariantId;
    if (!variantId) {
      navigate(`/product/${product.ID}`);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Add to Cart',
      message: `Add "${product.ProductName}" to your shopping cart?`,
      confirmText: 'Add to Cart',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const msg = await addToCart(variantId, 1);
          showToast(msg || 'Added to cart successfully!');
        } catch (err) {
          showToast(err.message || 'Error adding to cart', 'error');
        }
      }
    });
  };

  // Handle Price Filter Form
  const handleApplyPrice = (e) => {
    e.preventDefault();
    const minVal = minInput !== '' ? parseFloat(minInput) : null;
    const maxVal = maxInput !== '' ? parseFloat(maxInput) : null;
    setAppliedMinPrice(minVal);
    setAppliedMaxPrice(maxVal);
    setCurrentPage(1);
  };

  const handleClearPrice = () => {
    setMinInput('');
    setMaxInput('');
    setAppliedMinPrice(null);
    setAppliedMaxPrice(null);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setSelectedBrand('');
    setSelectedCategory('');
    setMinInput('');
    setMaxInput('');
    setAppliedMinPrice(null);
    setAppliedMaxPrice(null);
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Filtering Logic
  let filteredProducts = [...products];

  if (selectedBrand) {
    filteredProducts = filteredProducts.filter(p => (p.BrandName || '').toLowerCase() === selectedBrand.toLowerCase());
  }

  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(p => (p.CategoryName || '').toLowerCase() === selectedCategory.toLowerCase());
  }

  if (appliedMinPrice !== null && !isNaN(appliedMinPrice)) {
    filteredProducts = filteredProducts.filter(p => {
      const price = parseFloat(p.MinPrice || p.minPrice || p.Price || 0);
      return price >= appliedMinPrice;
    });
  }

  if (appliedMaxPrice !== null && !isNaN(appliedMaxPrice)) {
    filteredProducts = filteredProducts.filter(p => {
      const price = parseFloat(p.MinPrice || p.minPrice || p.Price || 0);
      return price <= appliedMaxPrice;
    });
  }

  // Sorting Logic
  filteredProducts.sort((a, b) => {
    const priceA = parseFloat(a.MinPrice || a.minPrice || a.Price || 0);
    const priceB = parseFloat(b.MinPrice || b.minPrice || b.Price || 0);
    const nameA = (a.ProductName || '').toLowerCase();
    const nameB = (b.ProductName || '').toLowerCase();
    const dateA = new Date(a.CreationDate || a.PostingDate || 0);
    const dateB = new Date(b.CreationDate || b.PostingDate || 0);

    switch (sortBy) {
      case 'price_low':
        return priceA - priceB;
      case 'price_high':
        return priceB - priceA;
      case 'name_az':
        return nameA.localeCompare(nameB);
      case 'name_za':
        return nameB.localeCompare(nameA);
      case 'newest':
      default:
        return dateB - dateA;
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (catalogHeaderRef.current) {
      catalogHeaderRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const hasActiveFilters = selectedBrand || selectedCategory || appliedMinPrice !== null || appliedMaxPrice !== null || sortBy !== 'newest';

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

      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: toastType === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: '600',
          animation: 'fadeIn 0.3s ease'
        }}>
          {toastType === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {toastMsg}
        </div>
      )}

      {/* Main Page Layout: Carousel + 2-Column Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '30px' }}>
        
        {/* Hero Carousel Section */}
        <div className="glass-panel" style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          minHeight: '360px',
          display: 'flex',
          alignItems: 'center',
          padding: '40px 30px',
          background: slides[slideIndex].bgGradient,
          transition: 'background 0.5s ease'
        }}>
          <div style={{ maxWidth: '580px', zIndex: 2 }}>
            <span style={{
              background: 'rgba(255,255,255,0.12)',
              border: `1px solid ${slides[slideIndex].badgeColor}`,
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '16px'
            }}>
              {slides[slideIndex].badge}
            </span>
            <h1 style={{ fontSize: '38px', fontWeight: '800', lineHeight: '1.15', marginBottom: '14px' }}>
              {slides[slideIndex].title}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px', lineHeight: '1.6' }}>
              {slides[slideIndex].desc}
            </p>
            <Link to={slides[slideIndex].link} className="glass-btn" style={{ borderRadius: '24px', padding: '12px 28px', fontSize: '15px' }}>
              {slides[slideIndex].btnText} <ArrowRight size={18} />
            </Link>
          </div>

          {/* Slider Arrow Controls */}
          <button
            onClick={() => setSlideIndex(prev => (prev - 1 + slides.length) % slides.length)}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setSlideIndex(prev => (prev + 1) % slides.length)}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3
            }}
          >
            <ChevronRight size={20} />
          </button>

          {/* Slider Dots */}
          <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 3 }}>
            {slides.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setSlideIndex(idx)}
                style={{
                  width: idx === slideIndex ? '24px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  background: idx === slideIndex ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Content Body Grid: Left Sidebar + Right Catalog */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Left Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Brands Filter Card */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={17} style={{ color: 'var(--primary)' }} /> All Brands
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => { setSelectedBrand(''); setCurrentPage(1); }}
                  className={`glass-btn ${selectedBrand === '' ? '' : 'glass-btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', borderRadius: '10px', padding: '8px 14px', fontSize: '13px' }}
                >
                  All Brands ({products.length})
                </button>
                {brands.map(b => {
                  const brandCount = products.filter(p => (p.BrandName || '').toLowerCase() === b.BrandName.toLowerCase()).length;
                  const isActive = selectedBrand.toLowerCase() === b.BrandName.toLowerCase();
                  return (
                    <button
                      key={b.ID}
                      onClick={() => { setSelectedBrand(b.BrandName); setCurrentPage(1); }}
                      className={`glass-btn ${isActive ? '' : 'glass-btn-secondary'}`}
                      style={{ justifyContent: 'space-between', borderRadius: '10px', padding: '8px 14px', fontSize: '13px' }}
                    >
                      <span>{b.BrandName}</span>
                      <span style={{ fontSize: '11px', opacity: 0.7 }}>({brandCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter Card */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Grid size={17} style={{ color: 'var(--secondary)' }} /> All Categories
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                  className={`glass-btn ${selectedCategory === '' ? '' : 'glass-btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', borderRadius: '10px', padding: '8px 14px', fontSize: '13px' }}
                >
                  All Categories
                </button>
                {categories.map(cat => {
                  const isActive = selectedCategory.toLowerCase() === cat.CategoryName.toLowerCase();
                  return (
                    <button
                      key={cat.ID}
                      onClick={() => { setSelectedCategory(cat.CategoryName); setCurrentPage(1); }}
                      className={`glass-btn ${isActive ? '' : 'glass-btn-secondary'}`}
                      style={{ justifyContent: 'flex-start', borderRadius: '10px', padding: '8px 14px', fontSize: '13px' }}
                    >
                      {cat.CategoryName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range Filter Card */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={17} style={{ color: 'var(--success)' }} /> Price Range
              </h3>
              <form onSubmit={handleApplyPrice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Min (LKR)</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={minInput}
                      onChange={(e) => setMinInput(e.target.value)}
                      className="custom-glass-input"
                      style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Max (LKR)</label>
                    <input
                      type="number"
                      placeholder="Any"
                      min="0"
                      value={maxInput}
                      onChange={(e) => setMaxInput(e.target.value)}
                      className="custom-glass-input"
                      style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '8px' }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="submit"
                    className="glass-btn"
                    style={{ fontSize: '12px', padding: '8px', borderRadius: '8px', justifyContent: 'center' }}
                  >
                    <Filter size={13} /> Apply
                  </button>
                  <button
                    type="button"
                    onClick={handleClearPrice}
                    className="glass-btn glass-btn-secondary"
                    style={{ fontSize: '12px', padding: '8px', borderRadius: '8px', justifyContent: 'center' }}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Right Main Catalog Content */}
          <div ref={catalogHeaderRef} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header Title + Sort Dropdown */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800' }}>
                  {selectedBrand && selectedCategory 
                    ? `${selectedBrand} — ${selectedCategory}` 
                    : selectedBrand 
                    ? `${selectedBrand} Mobiles` 
                    : selectedCategory 
                    ? selectedCategory 
                    : 'Featured Catalog'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                </p>
              </div>

              {/* Sort Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowUpDown size={14} /> Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                  className="custom-glass-input"
                  style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', background: 'rgba(30, 41, 59, 0.65)' }}
                >
                  <option value="newest" style={{ background: '#0f172a' }}>Newest First</option>
                  <option value="price_low" style={{ background: '#0f172a' }}>Price: Low → High</option>
                  <option value="price_high" style={{ background: '#0f172a' }}>Price: High → Low</option>
                  <option value="name_az" style={{ background: '#0f172a' }}>Name: A → Z</option>
                  <option value="name_za" style={{ background: '#0f172a' }}>Name: Z → A</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display Pills */}
            {hasActiveFilters && (
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: 'rgba(30, 41, 59, 0.35)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginRight: '4px' }}>Active Filters:</span>
                
                {selectedBrand && (
                  <span className="glass-btn glass-btn-secondary" style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '14px', gap: '4px' }}>
                    Brand: {selectedBrand}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedBrand('')} />
                  </span>
                )}

                {selectedCategory && (
                  <span className="glass-btn glass-btn-secondary" style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '14px', gap: '4px' }}>
                    Category: {selectedCategory}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedCategory('')} />
                  </span>
                )}

                {(appliedMinPrice !== null || appliedMaxPrice !== null) && (
                  <span className="glass-btn glass-btn-secondary" style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '14px', gap: '4px' }}>
                    Price: {appliedMinPrice !== null ? `From Rs.${appliedMinPrice.toLocaleString()}` : ''} {appliedMaxPrice !== null ? `Up to Rs.${appliedMaxPrice.toLocaleString()}` : ''}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={handleClearPrice} />
                  </span>
                )}

                {sortBy !== 'newest' && (
                  <span className="glass-btn glass-btn-secondary" style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '14px', gap: '4px' }}>
                    Sort: {sortBy}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSortBy('newest')} />
                  </span>
                )}

                <button
                  onClick={handleClearAllFilters}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginLeft: 'auto'
                  }}
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading mobile catalog...</div>
            ) : currentProducts.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                No mobile products found matching your filter criteria.
                <div style={{ marginTop: '16px' }}>
                  <button onClick={handleClearAllFilters} className="glass-btn" style={{ borderRadius: '20px', padding: '8px 20px', fontSize: '13px' }}>
                    Reset Filters
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '24px'
              }}>
                {currentProducts.map(p => {
                  const isPromo = p.discountActive;
                  const price = parseFloat(p.MinPrice || p.minPrice || p.Price || 0);
                  const discountedPrice = parseFloat(p.MinPriceDiscounted || p.minPriceDiscounted || price);
                  const totalStock = parseInt(p.TotalStock ?? p.totalStock ?? p.Stock ?? 0);
                  const isOutOfStock = totalStock <= 0;
                  const isWishlisted = wishlistIds.includes(p.ID);

                  return (
                    <div 
                      key={p.ID} 
                      onClick={() => navigate(`/product/${p.ID}`)}
                      className="glass-card" 
                      style={{ display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer' }}
                    >
                      
                      {/* Floating Wishlist Heart Button */}
                      <button
                        onClick={(e) => requestToggleWishlist(e, p)}
                        className="wishlist-btn-floating"
                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <Heart size={18} fill={isWishlisted ? "#ef4444" : "none"} />
                      </button>

                      {/* Image & Discount Badge */}
                      <div style={{ position: 'relative' }}>
                        {isPromo && !isOutOfStock && (
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            background: 'linear-gradient(45deg, #ef4444, #ec4899)',
                            color: '#fff',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            zIndex: 2
                          }}>
                            <Flame size={12} /> {p.DiscountPercent}% OFF
                          </div>
                        )}
                        <ProductImage src={p.Image1} alt={p.ProductName} isOutOfStock={isOutOfStock} />
                      </div>

                      {/* Product Content Body */}
                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {p.BrandName} &bull; {p.CategoryName || 'Mobile'}
                        </span>
                        
                        <h3 style={{ fontSize: '16px', fontWeight: '700', lineHeight: '1.3', color: 'var(--text-primary)' }}>
                          {p.ProductName}
                        </h3>

                        {/* Price Tag */}
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: '8px', paddingTop: '8px' }}>
                          {isPromo ? (
                            <>
                              <span style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                                Rs. {discountedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                                Rs. {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </>
                          ) : (
                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#06b6d4' }}>
                              {price > 0 ? `Rs. ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Price on request'}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons: Only Add to Cart (or Out of Stock badge) */}
                        <div style={{ marginTop: '10px' }}>
                          {isOutOfStock ? (
                            <button 
                              disabled 
                              onClick={(e) => e.stopPropagation()}
                              className="glass-btn" 
                              style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed', borderRadius: '12px', fontSize: '13px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                            >
                              <Ban size={14} /> Out of Stock
                            </button>
                          ) : (
                            <button
                              onClick={(e) => requestAddToCart(e, p)}
                              className="glass-btn"
                              style={{ width: '100%', borderRadius: '12px', fontSize: '13px', padding: '10px 14px', justifyContent: 'center' }}
                            >
                              <ShoppingCart size={15} /> Add to Cart
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                <ul className="pagination-custom">
                  {/* Prev Button */}
                  <li>
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="page-link-custom"
                    >
                      &laquo; Prev
                    </button>
                  </li>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <li key={pageNum}>
                      <button
                        onClick={() => handlePageChange(pageNum)}
                        className={`page-link-custom ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    </li>
                  ))}

                  {/* Next Button */}
                  <li>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="page-link-custom"
                    >
                      Next &raquo;
                    </button>
                  </li>
                </ul>
              </div>
            )}

          </div>
        </div>

        {/* Bottom Service Feature Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          marginTop: '20px'
        }}>
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '14px' }}>
              <Truck size={24} />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Free Delivery</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>For all islandwide qualifying orders</p>
          </div>

          <div className="glass-card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: 'rgba(6, 180, 210, 0.15)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', marginBottom: '14px' }}>
              <Shield size={24} />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Safe Payment</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>100% secure checkout protection</p>
          </div>

          <div className="glass-card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', marginBottom: '14px' }}>
              <RefreshCw size={24} />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Easy Returns</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>30 days hassle-free money back</p>
          </div>

          <div className="glass-card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', marginBottom: '14px' }}>
              <Headphones size={24} />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>24/7 Support</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dedicated customer helpdesk</p>
          </div>
        </div>

      </div>
    </div>
  );
}
