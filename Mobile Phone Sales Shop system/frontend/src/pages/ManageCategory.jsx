import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Pencil, Trash2, Grid3X3, AlertCircle, CheckCircle, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';

export default function ManageCategory() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Confirmation modal state for deletion
  const [deleteId, setDeleteId] = useState(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState('');

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

    fetchCategories();
  }, [token, user, authLoading]);

  const fetchCategories = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/products/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } else {
        setErrorMsg('Failed to fetch category list.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error communicating with the server.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id, name) => {
    setDeleteId(id);
    setDeleteCategoryName(name);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/products/categories/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Category deleted successfully.');
        fetchCategories();
      } else {
        setErrorMsg(data.message || 'Failed to delete category.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error communicating with the server.');
    } finally {
      setDeleteId(null);
      setDeleteCategoryName('');
    }
  };

  // Filter & Pagination calculations
  const filteredCategories = categories.filter(c =>
    (c.CategoryName || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  const totalRows = filteredCategories.length;
  const totalPages = Math.ceil(totalRows / limit) || 1;
  const page = Math.max(1, Math.min(currentPage, totalPages));
  const offset = (page - 1) * limit;
  const paginatedCategories = filteredCategories.slice(offset, offset + limit);

  return (
    <AdminLayout>
      <div className="container-fluid p-4 animate-fade-in">
        {/* Top Header Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
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
              borderRadius: '12px'
            }}>Catalog Management</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Grid3X3 size={28} className="text-primary" /> Manage Categories
            </h1>
          </div>

          <Link to="/admin/add-category" className="glass-btn" style={{ borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add New Category
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

        {/* Main Panel */}
        <div className="glass-panel" style={{ borderRadius: '20px', padding: '24px', background: 'rgba(15, 23, 42, 0.75)' }}>
          {/* Search bar row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <input
                type="text"
                placeholder="Search categories..."
                className="glass-input"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px', borderRadius: '12px', fontSize: '14px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>

            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
              Showing {totalRows > 0 ? offset + 1 : 0} - {Math.min(offset + limit, totalRows)} of {totalRows} category(ies)
            </span>
          </div>

          {/* Glass Table */}
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 18px', width: '60px' }}>#</th>
                  <th style={{ padding: '14px 18px' }}>Category Name</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px' }}>Creation Date</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right', width: '180px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading categories...
                    </td>
                  </tr>
                ) : paginatedCategories.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No categories found. <Link to="/admin/add-category" style={{ color: 'var(--primary)', fontWeight: '700' }}>Add one now</Link>.
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.map((row, idx) => {
                    const cnt = offset + idx + 1;
                    const isStatusActive = String(row.Status) === '1' || row.Status === 1;
                    const formattedDate = row.CreationDate
                      ? new Date(row.CreationDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                      : 'N/A';

                    return (
                      <tr key={row.ID} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{cnt}</td>
                        <td style={{ padding: '14px 18px', fontWeight: '700', color: '#fff' }}>{row.CategoryName}</td>
                        <td style={{ padding: '14px 18px' }}>
                          {isStatusActive ? (
                            <span style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#34d399',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>Active</span>
                          ) : (
                            <span style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>Inactive</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{formattedDate}</td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <Link
                              to={`/admin/edit-category/${row.ID}`}
                              className="glass-btn"
                              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Pencil size={13} /> Edit
                            </Link>

                            <button
                              onClick={() => confirmDelete(row.ID, row.CategoryName)}
                              style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                color: '#f87171',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                            >
                              <Trash2 size={13} /> Delete
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setSearchParams({ page: (page - 1).toString() })}
                className="glass-btn-secondary"
                style={{ borderRadius: '8px', padding: '6px 12px', opacity: page <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setSearchParams({ page: p.toString() })}
                  className={page === p ? 'glass-btn' : 'glass-btn-secondary'}
                  style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '13px', minWidth: '34px' }}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page >= totalPages}
                onClick={() => setSearchParams({ page: (page + 1).toString() })}
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
                Delete Category
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '24px', lineHeight: '1.5' }}>
                Are you sure you want to permanently delete the category <strong>"{deleteCategoryName}"</strong>? This action cannot be undone.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setDeleteId(null)}
                  className="glass-btn-secondary"
                  style={{ borderRadius: '10px', padding: '8px 18px', fontSize: '14px' }}
                >
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
