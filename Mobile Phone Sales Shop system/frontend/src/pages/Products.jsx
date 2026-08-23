import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Flame, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Products() {
  const { API_URL } = useAuth();
  const location = useLocation();

  // Search parameters from URL
  const queryParams = new URLSearchParams(location.search);
  const urlSearch = queryParams.get('search') || '';

  // Lists
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchVal, setSearchVal] = useState(urlSearch);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchVal(urlSearch);
  }, [urlSearch]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch(`${API_URL}/products?limit=100`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products);
      }

      const brandRes = await fetch(`${API_URL}/products/brands`);
      if (brandRes.ok) {
        const brandData = await brandRes.json();
        setBrands(brandData.filter(b => b.Status === 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesBrand = selectedBrand ? p.BrandName === selectedBrand : true;
    const matchesSearch = searchVal
      ? p.ProductName.toLowerCase().includes(searchVal.toLowerCase()) ||
        p.BrandName.toLowerCase().includes(searchVal.toLowerCase()) ||
        p.ModelNumber.toLowerCase().includes(searchVal.toLowerCase())
      : true;
    return matchesBrand && matchesSearch;
  });

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Page title */}
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Browse Catalog</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Find the perfect smartphone or tablet configuration tailored for you.
          </p>
        </div>

        {/* Search & Filter Section */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flexGrow: 1, minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search by title, brand or model..."
              className="glass-input"
              style={{ width: '100%', paddingLeft: '40px' }}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
          </div>

          {/* Brands list */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={() => setSelectedBrand('')}
              className={`glass-btn ${selectedBrand === '' ? '' : 'glass-btn-secondary'}`}
              style={{ borderRadius: '20px', padding: '8px 16px', fontSize: '13px' }}
            >
              All Brands
            </button>
            {brands.map(b => (
              <button
                key={b.ID}
                onClick={() => setSelectedBrand(b.BrandName)}
                className={`glass-btn ${selectedBrand === b.BrandName ? '' : 'glass-btn-secondary'}`}
                style={{ borderRadius: '20px', padding: '8px 16px', fontSize: '13px' }}
              >
                {b.BrandName}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog list grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading catalog list...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>No catalog items found matching your criteria.</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '30px'
          }}>
            {filteredProducts.map(p => {
              const isPromo = p.discountActive;
              return (
                <div key={p.ID} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Image wrapper */}
                  <div style={{ position: 'relative', height: '200px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <span style={{ fontSize: '60px' }}>📱</span>
                  </div>

                  {/* Details body */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                      {p.BrandName} &bull; {p.CategoryName}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{p.ProductName}</h3>
                    
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      {isPromo ? (
                        <>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>
                            Rs. {parseFloat(p.priceWithDiscount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                            Rs. {parseFloat(p.minPrice).toLocaleString('en-US')}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '18px', fontWeight: '800' }}>
                          Rs. {parseFloat(p.minPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
