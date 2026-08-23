import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Shield, Truck, Zap, Flame, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const IMAGE_BASE = 'http://localhost:5000/uploads/products/';

function ProductImage({ src, alt }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return <span style={{ fontSize: '64px' }}>📱</span>;
  }
  return (
    <img
      src={IMAGE_BASE + src}
      alt={alt}
      onError={() => setError(true)}
      style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
    />
  );
}

export default function Home() {
  const { API_URL } = useAuth();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        // Fetch brands
        const brandRes = await fetch(`${API_URL}/products/brands`);
        if (brandRes.ok) {
          const brandData = await brandRes.json();
          setBrands(brandData.filter(b => b.Status === 1));
        }

        // Fetch products
        const prodRes = await fetch(`${API_URL}/products`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(Array.isArray(prodData) ? prodData : (prodData.products || []));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const filteredProducts = selectedBrand
    ? products.filter(p => p.BrandName === selectedBrand)
    : products;

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
      
      {/* Hero Banner */}
      <div className="glass-panel" style={{
        padding: '60px 40px',
        borderRadius: '24px',
        background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.15), rgba(15, 23, 42, 0.55))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <span style={{
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#c7d2fe',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            display: 'inline-block',
            marginBottom: '20px'
          }}>GRAND INAUGURAL EVENT</span>
          
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            lineHeight: '1.1',
            marginBottom: '20px',
            letterSpacing: '-1px'
          }}>
            Next-Gen Mobile <br />
            <span style={{
              background: 'linear-gradient(90deg, #ec4899, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Experience Is Here</span>
          </h1>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '30px', lineHeight: '1.6' }}>
            Browse our catalog of premium smartphones and tablets. Get loyalty points on every purchase, tracked repairs, and lightning fast checkout.
          </p>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to="/products" className="glass-btn" style={{ borderRadius: '24px' }}>
              Shop Now <Smartphone size={18} />
            </Link>
            <a href="#brands" className="glass-btn glass-btn-secondary" style={{ borderRadius: '24px' }}>
              Explore Brands
            </a>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px'
      }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '12px', color: 'var(--primary)' }}>
            <Shield size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>100% Genuine</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Authorized brand warranty</p>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(6, 180, 210, 0.15)', padding: '12px', borderRadius: '12px', color: 'var(--secondary)' }}>
            <Truck size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Secure Delivery</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fast and insured shipping</p>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '12px', color: 'var(--success)' }}>
            <Award size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Loyalty Rewards</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Earn points on every Rs. 1000</p>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '12px', color: 'var(--danger)' }}>
            <Zap size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Expert Repairs</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Technician diagnostic logging</p>
          </div>
        </div>
      </div>

      {/* Brands Selector */}
      <div id="brands" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Shop by Brand</h2>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <button
            onClick={() => setSelectedBrand('')}
            className={`glass-btn ${selectedBrand === '' ? '' : 'glass-btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '10px 20px', fontSize: '14px' }}
          >
            All Brands
          </button>
          {brands.map(b => (
            <button
              key={b.ID}
              onClick={() => setSelectedBrand(b.BrandName)}
              className={`glass-btn ${selectedBrand === b.BrandName ? '' : 'glass-btn-secondary'}`}
              style={{ borderRadius: '20px', padding: '10px 20px', fontSize: '14px' }}
            >
              {b.BrandName}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Products Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Featured Catalog</h2>
          <Link to="/products" style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '600' }}>View All Products &rarr;</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No products found under this brand.</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '30px'
          }}>
            {filteredProducts.map(p => {
              const isPromo = p.discountActive;
              const price = parseFloat(p.MinPrice || p.minPrice || 0);
              const discountedPrice = parseFloat(p.MinPriceDiscounted || p.minPriceDiscounted || price);
              return (
                <div key={p.ID} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Image/Discount badge */}
                  <div style={{ position: 'relative', height: '220px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isPromo && (
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
                        gap: '4px'
                      }}>
                        <Flame size={12} /> {p.DiscountPercent}% OFF
                      </div>
                    )}
                    <ProductImage src={p.Image1} alt={p.ProductName} />
                  </div>

                  {/* Body */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                      {p.BrandName} &bull; {p.CategoryName}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{p.ProductName}</h3>
                    
                    {/* Price list */}
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      {isPromo ? (
                        <>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>
                            Rs. {discountedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                            Rs. {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '18px', fontWeight: '800' }}>
                          {price > 0 ? `Rs. ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Price on request'}
                        </span>
                      )}
                    </div>

                    <Link to={`/product/${p.ID}`} className="glass-btn" style={{ width: '100%', marginTop: '15px', borderRadius: '12px', fontSize: '14px' }}>
                      View Configuration
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
