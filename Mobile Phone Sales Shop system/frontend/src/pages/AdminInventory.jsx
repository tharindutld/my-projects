import React, { useState, useEffect, useCallback } from 'react';
import { Package, Search, AlertTriangle, ArrowUpDown, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

export default function AdminInventory() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);

  // Modal state
  const [modal, setModal] = useState(null); // { variantId, name, stock }
  const [modalQty, setModalQty] = useState('');
  const [modalType, setModalType] = useState('Restock');
  const [modalNotes, setModalNotes] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const LIMIT = 15;

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.append('search', search);
      const res = await fetch(`${API_URL}/inventory?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalRows(data.totalRows || 0);
      }

      const lowRes = await fetch(`${API_URL}/inventory/low-stock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (lowRes.ok) {
        const lowData = await lowRes.json();
        setLowStock(lowData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, token, API_URL]);

  useEffect(() => {
    if (authLoading) return;

    if (!token || !user || user.role === 'Customer') {
      navigate('/login?staff=true');
      return;
    }
    loadInventory();
  }, [loadInventory, authLoading, token, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadInventory();
  };

  const openModal = (item) => {
    setModal(item);
    setModalQty('');
    setModalType('Restock');
    setModalNotes('');
    setModalError('');
  };

  const submitAdjust = async () => {
    if (!modalQty || parseInt(modalQty) === 0 || !modalNotes.trim()) {
      setModalError('Please fill in quantity adjustment and log notes.');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      const res = await fetch(`${API_URL}/inventory/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          variantId: modal.variantId,
          qtyAdjust: parseInt(modalQty),
          movementType: modalType,
          notes: modalNotes
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.message || 'Failed to update stock.');
        return;
      }
      setModal(null);
      setSuccessMsg(data.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadInventory();
    } catch (err) {
      setModalError('Network error. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const getStockBadge = (stock) => {
    if (stock === 0) return { bg: 'rgba(239,68,68,0.15)', color: 'var(--danger)', border: 'var(--danger)', label: '0 units' };
    if (stock <= 5) return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '#f59e0b', label: `${stock} units` };
    return { bg: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: 'var(--success)', label: `${stock} units` };
  };

  return (
    <AdminLayout>
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={28} style={{ color: 'var(--primary)' }} /> Inventory Stock Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Track stock levels, perform manual adjustments, and search products.
          </p>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--success)', borderRadius: '10px', padding: '12px 16px', color: 'var(--success)', marginBottom: '20px', fontSize: '14px' }}>
          {successMsg}
        </div>
      )}

      {/* Low Stock Alert Banner */}
      {lowStock.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
              <div>
                <p style={{ fontWeight: '700', fontSize: '15px' }}>Low Stock Notification</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  <strong>{lowStock.length}</strong> product variant(s) are below reorder threshold (≤ 5 units left).
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className="glass-btn glass-btn-secondary"
              style={{ fontSize: '13px', borderRadius: '20px' }}
            >
              {showLowStock ? 'Hide' : `View Low Stock (${lowStock.length})`}
            </button>
          </div>
          {showLowStock && (
            <div style={{ marginTop: '16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Product Variant</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Available Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map(ls => (
                    <tr key={ls.variantId} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '600' }}>{ls.ProductName} — {ls.Color} ({ls.ROM} / {ls.RAM})</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: ls.Stock === 0 ? 'var(--danger)' : '#f59e0b', fontWeight: '700' }}>{ls.Stock} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <input
              type="text"
              placeholder="Search by product name, brand, model, color, RAM, or storage..."
              className="glass-input"
              style={{ width: '100%', paddingLeft: '40px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
          </div>
          <button type="submit" className="glass-btn" style={{ borderRadius: '8px', whiteSpace: 'nowrap' }}>Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); }} className="glass-btn glass-btn-secondary" style={{ borderRadius: '8px' }}>
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '700', fontSize: '15px' }}>Inventory Records</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{totalRows} total variants</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>#</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Product / Variant</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Brand</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Model No.</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Initial</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Sold</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Available</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                {user?.role === 'Admin' && (
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading inventory...</td></tr>
              ) : inventory.length === 0 ? (
                <tr><td colSpan="9" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No inventory records found.</td></tr>
              ) : inventory.map((row, idx) => {
                const badge = getStockBadge(row.Stock);
                return (
                  <tr key={row.variantId} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{(page - 1) * LIMIT + idx + 1}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600' }}>{row.ProductName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.Color} • {row.ROM} / {row.RAM}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{row.BrandName}</td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{row.ModelNumber}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.initial}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.soldQty}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', display: 'inline-block' }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{
                        background: row.Status === 1 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: row.Status === 1 ? 'var(--success)' : 'var(--danger)',
                        borderRadius: '20px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        display: 'inline-block'
                      }}>
                        {row.Status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {user?.role === 'Admin' && (
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => openModal({ variantId: row.variantId, name: `${row.ProductName} — ${row.Color} (${row.ROM} / ${row.RAM})`, stock: row.Stock })}
                          className="glass-btn glass-btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <ArrowUpDown size={13} /> Update Stock
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="glass-btn glass-btn-secondary" style={{ padding: '8px 14px', borderRadius: '8px' }}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2).map((p, i, arr) => (
              <React.Fragment key={p}>
                {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: 'var(--text-muted)' }}>...</span>}
                <button
                  onClick={() => setPage(p)}
                  className={`glass-btn ${page === p ? '' : 'glass-btn-secondary'}`}
                  style={{ padding: '8px 14px', borderRadius: '8px', minWidth: '38px' }}
                >{p}</button>
              </React.Fragment>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="glass-btn glass-btn-secondary" style={{ padding: '8px 14px', borderRadius: '8px' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Update Stock Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '30px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ArrowUpDown size={20} style={{ color: 'var(--primary)' }} /> Adjust Inventory Stock
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Variant Name / Spec</label>
                <input type="text" value={modal.name} readOnly className="glass-input" style={{ width: '100%', opacity: 0.7 }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Current Available Stock</label>
                <input type="text" value={`${modal.stock} units`} readOnly className="glass-input" style={{ width: '100%', opacity: 0.7 }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Quantity Adjustment *</label>
                <input
                  type="number"
                  placeholder="e.g. 10 to add, -5 to subtract"
                  className="glass-input"
                  style={{ width: '100%' }}
                  value={modalQty}
                  onChange={e => setModalQty(e.target.value)}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Enter a positive number to add stock, or negative to write off.</p>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Movement Type *</label>
                <select value={modalType} onChange={e => setModalType(e.target.value)} className="glass-input" style={{ width: '100%' }}>
                  <option value="Restock">Restock (Add Shipment)</option>
                  <option value="Correction">Correction (Inventory Audit / Damage)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Log Notes / Reference Info *</label>
                <input
                  type="text"
                  placeholder="e.g. Shipment #9201, or Audit write-off"
                  className="glass-input"
                  style={{ width: '100%' }}
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                />
              </div>
              {modalError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                  {modalError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} className="glass-btn glass-btn-secondary" style={{ borderRadius: '8px' }}>Cancel</button>
              <button onClick={submitAdjust} disabled={modalLoading} className="glass-btn" style={{ borderRadius: '8px' }}>
                {modalLoading ? 'Saving...' : 'Update Inventory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
