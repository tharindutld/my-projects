import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Pencil, Trash2, Smartphone, AlertCircle, CheckCircle, Plus, Search, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';

export default function ManageProduct() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filterBrand, setFilterBrand] = useState(searchParams.get('brand') || '');
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const limit = 10;

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate('/login?staff=true');
      return;
    }
    if (user && user.role === 'Customer') {
      navigate('/');
      return;
    }

    fetchMetadata();
    fetchProducts();
  }, [token, user, authLoading, searchParams]);

  const fetchMetadata = async () => {
    try {
      const [resB, resC] = await Promise.all([
        fetch(`${API_URL}/products/brands`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/products/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (resB.ok) setBrands(await resB.json());
      if (resC.ok) setCategories(await resC.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterBrand) params.append('brand', filterBrand);
      if (filterCategory) params.append('category', filterCategory);

      const res = await fetch(`${API_URL}/products?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        let data = await res.json();
        if (filterStatus !== '') {
          data = data.filter(p => String(p.Status) === String(filterStatus));
        }
        setProducts(Array.isArray(data) ? data : []);
      } else {
        setErrorMsg('Failed to fetch product catalog.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    const newParams = {};
    if (searchTerm) newParams.search = searchTerm;
    if (filterBrand) newParams.brand = filterBrand;
    if (filterCategory) newParams.category = filterCategory;
    if (filterStatus !== '') newParams.status = filterStatus;
    setSearchParams(newParams);
  };

  const handleClearFilter = () => {
    setSearchTerm('');
    setFilterBrand('');
    setFilterCategory('');
    setFilterStatus('');
    setSearchParams({});
  };

  const confirmDelete = (id, name) => {
    setDeleteId(id);
    setDeleteName(name);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/products/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Product deleted successfully.');
        fetchProducts();
      } else {
        setErrorMsg(data.message || 'Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error connecting to server.');
    } finally {
      setDeleteId(null);
      setDeleteName('');
    }
  };

  // Pagination calculation
  const totalRows = products.length;
  const totalPages = Math.ceil(totalRows / limit) || 1;
  const page = Math.max(1, Math.min(currentPage, totalPages));
  const offset = (page - 1) * limit;
  const paginatedProducts = products.slice(offset, offset + limit);

  return (
    <AdminLayout>
      <div className="container-fluid p-4 animate-fade-in">
        {/* Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--primary)',
              background: 'rgba(99,102,241,0.12)',
              padding: '4px 10px',
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '10px'
            }}>Inventory Catalog</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Smartphone size={28} className="text-primary" /> Manage Products
            </h1>
          </div>

          <Link to="/admin/add-product" className="glass-btn" style={{ borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add New Product
          </Link>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px'
          }}>
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: '#34d399',
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px'
          }}>
            <CheckCircle size={18} /> {successMsg}
          </div>
        )}

        {/* Filter Glass Toolbar */}
        <div className="glass-panel" style={{ borderRadius: '16px', padding: '20px', marginBottom: '24px', background: 'rgba(15, 23, 42, 0.75)' }}>
          <form onSubmit={handleApplyFilter} className="row g-3 align-items-end">
            <div className="col-md-3">
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Search</label>
              <div style={{ position: 'relative', marginTop: '4px' }}>
                <input
                  type="text"
                  placeholder="Name, model..."
                  className="glass-input"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingLeft: '36px', borderRadius: '10px', fontSize: '13px' }}
                />
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="col-md-3">
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Brand</label>
              <select
                className="glass-input"
                value={filterBrand}
                onChange={e => setFilterBrand(e.target.value)}
                style={{ width: '100%', borderRadius: '10px', fontSize: '13px', marginTop: '4px', background: 'rgba(15,23,42,0.9)' }}
              >
                <option value="">All Brands</option>
                {brands.map(b => (
                  <option key={b.ID} value={b.BrandName}>{b.BrandName}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Category</label>
              <select
                className="glass-input"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                style={{ width: '100%', borderRadius: '10px', fontSize: '13px', marginTop: '4px', background: 'rgba(15,23,42,0.9)' }}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.ID} value={c.CategoryName}>{c.CategoryName}</option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Status</label>
              <select
                className="glass-input"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ width: '100%', borderRadius: '10px', fontSize: '13px', marginTop: '4px', background: 'rgba(15,23,42,0.9)' }}
              >
                <option value="">All Status</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>

            <div className="col-md-1 d-flex gap-2">
              <button type="submit" className="glass-btn" style={{ padding: '8px 14px', borderRadius: '10px' }} title="Filter">
                <Filter size={15} />
              </button>
              <button type="button" onClick={handleClearFilter} className="glass-btn-secondary" style={{ padding: '8px 14px', borderRadius: '10px' }} title="Clear">
                <X size={15} />
              </button>
            </div>
          </form>
        </div>

        {/* Results Info */}
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '600' }}>
          Showing {totalRows > 0 ? offset + 1 : 0} - {Math.min(offset + limit, totalRows)} of {totalRows} product(s)
        </p>

        {/* Products Table Panel */}
        <div className="glass-panel" style={{ borderRadius: '20px', padding: '24px', background: 'rgba(15, 23, 42, 0.75)' }}>
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 16px', width: '50px' }}>#</th>
                  <th style={{ padding: '14px 16px' }}>Product Name</th>
                  <th style={{ padding: '14px 16px' }}>Brand</th>
                  <th style={{ padding: '14px 16px' }}>Category</th>
                  <th style={{ padding: '14px 16px' }}>Model No.</th>
                  <th style={{ padding: '14px 16px' }}>Price Range</th>
                  <th style={{ padding: '14px 16px' }}>Stock</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Date Added</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading catalog...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No products found. <Link to="/admin/add-product" style={{ color: 'var(--primary)', fontWeight: '700' }}>Add a product now</Link>.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p, idx) => {
                    const cnt = offset + idx + 1;
                    const isActive = String(p.Status) === '1' || p.Status === 1;
                    const formattedDate = p.CreationDate
                      ? new Date(p.CreationDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                      : 'N/A';

                    const minP = parseFloat(p.MinPrice || 0);
                    const maxP = parseFloat(p.MaxPrice || 0);
                    const priceLabel = minP === maxP
                      ? `LKR ${minP.toLocaleString()}`
                      : `LKR ${minP.toLocaleString()} - ${maxP.toLocaleString()}`;

                    return (
                      <tr key={p.ID} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{cnt}</td>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#fff' }}>{p.ProductName}</td>
                        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.85)' }}>{p.BrandName}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            background: 'rgba(99,102,241,0.12)',
                            color: 'var(--primary)',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>{p.CategoryName || '—'}</span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{p.ModelNumber}</td>
                        <td style={{ padding: '14px 16px', fontWeight: '600', color: '#38bdf8' }}>{priceLabel}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            background: 'rgba(255,255,255,0.08)',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}>{p.TotalStock || 0}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {isActive ? (
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '3px 8px', borderRadius: '16px', fontSize: '11px', fontWeight: '700' }}>Active</span>
                          ) : (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '3px 8px', borderRadius: '16px', fontSize: '11px', fontWeight: '700' }}>Inactive</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{formattedDate}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <Link
                              to={`/admin/editproducts/${p.ID}`}
                              className="glass-btn"
                              style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Pencil size={12} /> Edit
                            </Link>

                            <button
                              onClick={() => confirmDelete(p.ID, p.ProductName)}
                              style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                color: '#f87171',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: (page - 1).toString() })}
                className="glass-btn-secondary"
                style={{ borderRadius: '8px', padding: '6px 12px', opacity: page <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })}
                  className={page === p ? 'glass-btn' : 'glass-btn-secondary'}
                  style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '13px', minWidth: '34px' }}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page >= totalPages}
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: (page + 1).toString() })}
                className="glass-btn-secondary"
                style={{ borderRadius: '8px', padding: '6px 12px', opacity: page >= totalPages ? 0.4 : 1 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Glass Modal */}
        {deleteId && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.95)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444', marginBottom: '12px' }}>
                Delete Product
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '24px', lineHeight: '1.5' }}>
                Are you sure you want to permanently delete product <strong>"{deleteName}"</strong>? This will remove all associated catalog entries.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setDeleteId(null)} className="glass-btn-secondary" style={{ borderRadius: '10px', padding: '8px 18px', fontSize: '14px' }}>
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '8px 18px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
