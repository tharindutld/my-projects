import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Flame, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const IMAGE_BASE = 'http://localhost:5000/uploads/products/';

function ProductImage({ src, alt }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return <span style={{ fontSize: '60px' }}>📱</span>;
  }
  return (
    <img
      src={IMAGE_BASE + src}
      alt={alt}
      onError={() => setError(true)}
      style={{ maxHeight: '170px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
    />
  );
}

export default function Products() {
  const { API_URL } = useAuth();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const urlSearch = queryParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [searchVal, setSearchVal] = useState(urlSearch);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    setSearchVal(urlSearch);
  }, [urlSearch]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch(`${API_URL}/products?limit=200`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : (prodData.products || []));
      }

      const brandRes = await fetch(`${API_URL}/products/brands`);
      if (brandRes.ok) {
        const brandData = await brandRes.json();
        setBrands(brandData.filter(b => b.Status === 1));
      }

      const catRes = await fetch(`${API_URL}/products/categories`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.filter(c => c.Status === 1));
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

  // Reset pagination when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, selectedCategory, sortBy, searchVal]);

  // Client-side filter + sort
  let filteredProducts = products.filter(p => {
    const matchesBrand = selectedBrand ? p.BrandName === selectedBrand : true;
    const matchesCat = selectedCategory ? p.CategoryName === selectedCategory : true;
    const matchesSearch = searchVal
      ? (p.ProductName || '').toLowerCase().includes(searchVal.toLowerCase()) ||
        (p.BrandName || '').toLowerCase().includes(searchVal.toLowerCase()) ||
        (p.ModelNumber || '').toLowerCase().includes(searchVal.toLowerCase())
      : true;
    return matchesBrand && matchesCat && matchesSearch;
  });

  if (sortBy === 'price_asc') {
    filteredProducts = [...filteredProducts].sort((a, b) => parseFloat(a.MinPrice || 0) - parseFloat(b.MinPrice || 0));
  } else if (sortBy === 'price_desc') {
    filteredProducts = [...filteredProducts].sort((a, b) => parseFloat(b.MinPrice || 0) - parseFloat(a.MinPrice || 0));
  } else if (sortBy === 'newest') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.ID - a.ID);
  } else if (sortBy === 'name_asc') {
    filteredProducts = [...filteredProducts].sort((a, b) => (a.ProductName || '').localeCompare(b.ProductName || ''));
  }

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSelectedBrand('');
    setSelectedCategory('');
    setSortBy('');
    setSearchVal('');
  };

  const hasActiveFilters = selectedBrand || selectedCategory || sortBy || searchVal;

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Page title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Browse Catalog</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              {loading ? 'Loading...' : `${filteredProducts.length} phone${filteredProducts.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`glass-btn ${showFilters ? '' : 'glass-btn-secondary'}`}
            style={{ borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
          >
            <SlidersHorizontal size={16} /> Filters & Sort
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
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

            {/* Brands + Sort row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {/* Brand filter */}
              <div style={{ flex: '1', minWidth: '220px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>Brand</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedBrand('')}
                    className={`glass-btn ${selectedBrand === '' ? '' : 'glass-btn-secondary'}`}
                    style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '13px' }}
                  >All</button>
                  {brands.map(b => (
                    <button
                      key={b.ID}
                      onClick={() => setSelectedBrand(b.BrandName)}
                      className={`glass-btn ${selectedBrand === b.BrandName ? '' : 'glass-btn-secondary'}`}
                      style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '13px' }}
                    >{b.BrandName}</button>
                  ))}
                </div>
              </div>

              {/* Category filter */}
              {categories.length > 0 && (
                <div style={{ flex: '1', minWidth: '220px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>Category</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`glass-btn ${selectedCategory === '' ? '' : 'glass-btn-secondary'}`}
                      style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '13px' }}
                    >All</button>
                    {categories.map(c => (
                      <button
                        key={c.ID}
                        onClick={() => setSelectedCategory(c.CategoryName)}
                        className={`glass-btn ${selectedCategory === c.CategoryName ? '' : 'glass-btn-secondary'}`}
                        style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '13px' }}
                      >{c.CategoryName}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort */}
              <div style={{ minWidth: '200px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>Sort By</p>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', fontSize: '13px', padding: '8px 12px' }}
                >
                  <option value="">Default</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="newest">Newest First</option>
                  <option value="name_asc">Name: A → Z</option>
                </select>
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <div>
                <button onClick={clearFilters} className="glass-btn-secondary" style={{ borderRadius: '20px', padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <X size={14} /> Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Catalog list grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading catalog list...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>No catalog items found matching your criteria.</div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '30px'
            }}>
              {paginatedProducts.map(p => {
                const isPromo = p.discountActive;
                const price = parseFloat(p.MinPrice || p.minPrice || 0);
                const discountedPrice = parseFloat(p.MinPriceDiscounted || p.minPriceDiscounted || price);
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
                      <ProductImage src={p.Image1} alt={p.ProductName} />
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
                              Rs. {discountedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                              Rs. {price.toLocaleString('en-US')}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: '18px', fontWeight: '800' }}>
                            {price > 0 ? `Rs. ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Price on request'}
                          </span>
                        )}
                      </div>

                      <Link to={`/product/${p.ID}`} className="glass-btn" style={{ width: '100%', marginTop: '15px', borderRadius: '12px', fontSize: '14px' }}>
                        View Product
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Catalog Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
                <button
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="glass-btn-secondary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={currentPage === pageNum ? 'glass-btn' : 'glass-btn-secondary'}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        fontSize: '14px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="glass-btn-secondary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

      </div>

    </div>
  );
}
