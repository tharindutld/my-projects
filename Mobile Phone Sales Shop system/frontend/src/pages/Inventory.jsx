import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, AlertTriangle, Search, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, AlertCircle, X, ShieldAlert, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';

export default function Inventory() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [inventoryData, setInventoryData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showLowStockBanner, setShowLowStockBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const limit = 10;
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Manual Stock Adjustment Modal State
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qtyAdjust, setQtyAdjust] = useState('');
  const [movementType, setMovementType] = useState('Correction');
  const [notes, setNotes] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const isAdmin = user?.role === 'Admin';

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

    fetchInventory();
    fetchLowStock();
  }, [token, user, authLoading, searchParams]);

  const fetchInventory = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`${API_URL}/inventory?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setInventoryData(data.items || []);
        setTotalRows(data.totalRows || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setErrorMsg('Failed to load inventory details.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    try {
      const res = await fetch(`${API_URL}/inventory/low-stock`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLowStockItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = { page: '1' };
    if (searchTerm) newParams.search = searchTerm;
    setSearchParams(newParams);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchParams({ page: '1' });
  };

  const openAdjustModal = (item) => {
    setSelectedVariant(item);
    setQtyAdjust('');
    setMovementType('Correction');
    setNotes('');
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedVariant || !qtyAdjust) return;

    setErrorMsg('');
    setSuccessMsg('');
    setAdjusting(true);

    try {
      const res = await fetch(`${API_URL}/inventory/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          variantId: selectedVariant.variantId,
          qtyAdjust: parseInt(qtyAdjust, 10),
          movementType,
          notes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Stock updated successfully.');
        setSelectedVariant(null);
        fetchInventory();
        fetchLowStock();
      } else {
        setErrorMsg(data.message || 'Failed to update stock.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to communicate with server.');
    } finally {
      setAdjusting(false);
    }
  };

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
            }}>Inventory Control</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Box size={28} className="text-primary" /> Inventory Stock Management
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/admin/stock" className="glass-btn-secondary" style={{ borderRadius: '12px', padding: '10px 18px', fontSize: '14px', fontWeight: '600' }}>
              Batch Stock List
            </Link>
            <Link to="/admin/add-stock" className="glass-btn" style={{ borderRadius: '12px', padding: '10px 18px', fontSize: '14px', fontWeight: '700' }}>
              + Receive New Batch Stock
            </Link>
          </div>
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

        {/* Low Stock Warning Banner */}
        {lowStockItems.length > 0 && (
          <div className="glass-panel" style={{
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  padding: '10px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h6 style={{ fontSize: '15px', fontWeight: '800', color: '#fbbf24', margin: 0 }}>
                    Low Stock Notification
                  </h6>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '2px 0 0 0' }}>
                    <strong>{lowStockItems.length}</strong> product variant(s) are below reorder threshold (≤ 5 units left).
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLowStockBanner(!showLowStockBanner)}
                className="glass-btn-secondary"
                style={{ borderRadius: '10px', fontSize: '12px', padding: '6px 14px', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.4)' }}
              >
                {showLowStockBanner ? 'Hide Low Stock Items' : `View Low Stock Items (${lowStockItems.length})`}
              </button>
            </div>

            {showLowStockBanner && (
              <div style={{ marginTop: '16px', overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 14px' }}>Product Variant</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Available Stock</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map(item => (
                      <tr key={item.variantId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: '600', color: '#fff' }}>
                          {item.ProductName} — {item.Color} ({item.ROM} / {item.RAM})
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '800', color: item.Stock === 0 ? '#f87171' : '#fbbf24' }}>
                          {item.Stock} units
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {item.Stock === 0 ? (
                            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', display: 'inline-block' }}>Out of Stock</span>
                          ) : (
                            <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', display: 'inline-block' }}>Low Stock</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="glass-panel" style={{ borderRadius: '16px', padding: '18px', marginBottom: '24px', background: 'rgba(15, 23, 42, 0.75)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <input
                type="text"
                placeholder="Search inventory by Product Name, Brand, Model, Color, RAM, or ROM..."
                className="glass-input"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px', borderRadius: '10px', fontSize: '13px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
            </div>

            <button type="submit" className="glass-btn" style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>
              Search
            </button>
            {searchTerm && (
              <button type="button" onClick={handleClearSearch} className="glass-btn-secondary" style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '13px' }}>
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Results Info */}
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '600' }}>
          Showing {totalRows > 0 ? (currentPage - 1) * limit + 1 : 0} - {Math.min(currentPage * limit, totalRows)} of {totalRows} inventory variant(s)
        </p>

        {/* Inventory Table Panel */}
        <div className="glass-panel" style={{ borderRadius: '20px', padding: '24px', background: 'rgba(15, 23, 42, 0.75)' }}>
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 16px', width: '50px' }}>#</th>
                  <th style={{ padding: '14px 16px' }}>Product Name / Specification</th>
                  <th style={{ padding: '14px 16px' }}>Brand</th>
                  <th style={{ padding: '14px 16px' }}>Model Number</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Initial Stock</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Units Sold</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Available Stock</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading inventory...
                    </td>
                  </tr>
                ) : inventoryData.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No inventory records found matching your search.
                    </td>
                  </tr>
                ) : (
                  inventoryData.map((item, idx) => {
                    const cnt = (currentPage - 1) * limit + idx + 1;
                    const stock = parseInt(item.Stock || 0, 10);
                    const isActive = String(item.Status) === '1' || item.Status === 1;

                    return (
                      <tr key={item.variantId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{cnt}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#fff' }}>{item.ProductName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.Color} • {item.ROM} / {item.RAM}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.85)' }}>{item.BrandName}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{item.ModelNumber}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>{item.initial}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>{item.soldQty}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {stock === 0 ? (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '3px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '800' }}>
                              0 units
                            </span>
                          ) : stock <= 5 ? (
                            <span style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', padding: '3px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '800' }}>
                              {stock} units
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '3px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '800' }}>
                              {stock} units
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {isActive ? (
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>Active</span>
                          ) : (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>Inactive</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {isAdmin ? (
                            <button
                              onClick={() => openAdjustModal(item)}
                              className="glass-btn"
                              style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <ArrowUpDown size={13} /> Update Stock
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>View only</span>
                          )}
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
                disabled={currentPage <= 1}
                onClick={() => setSearchParams({ page: (currentPage - 1).toString(), search: searchTerm })}
                className="glass-btn-secondary"
                style={{ borderRadius: '8px', padding: '6px 12px', opacity: currentPage <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setSearchParams({ page: p.toString(), search: searchTerm })}
                  className={currentPage === p ? 'glass-btn' : 'glass-btn-secondary'}
                  style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '13px', minWidth: '34px' }}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setSearchParams({ page: (currentPage + 1).toString(), search: searchTerm })}
                className="glass-btn-secondary"
                style={{ borderRadius: '8px', padding: '6px 12px', opacity: currentPage >= totalPages ? 0.4 : 1 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Manual Stock Adjustment Modal */}
        {selectedVariant && (
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
            <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.95)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>
                  Manual Stock Adjustment
                </h3>
                <button onClick={() => setSelectedVariant(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                  {selectedVariant.ProductName} — {selectedVariant.Color}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Current Available Stock: <strong style={{ color: '#38bdf8' }}>{selectedVariant.Stock} units</strong>
                </div>
              </div>

              <form onSubmit={handleStockAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
                    Adjustment Quantity (+ / -) *
                  </label>
                  <input
                    type="number"
                    className="glass-input"
                    value={qtyAdjust}
                    onChange={e => setQtyAdjust(e.target.value)}
                    placeholder="e.g. 5 or -2"
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px' }}
                  />
                  <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Use positive numbers to add stock, negative to decrease stock.</small>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
                    Movement Type *
                  </label>
                  <select
                    className="glass-input"
                    value={movementType}
                    onChange={e => setMovementType(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px', background: 'rgba(15,23,42,0.9)' }}
                  >
                    <option value="Restock">Restock (Received Batch)</option>
                    <option value="Correction">Correction (Audit Fix)</option>
                    <option value="Damage">Damage / Defective</option>
                    <option value="Return">Customer Return</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
                    Reference Notes *
                  </label>
                  <textarea
                    className="glass-input"
                    rows="2"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Reason for manual adjustment..."
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setSelectedVariant(null)} className="glass-btn-secondary" style={{ borderRadius: '10px', padding: '8px 16px', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={adjusting} className="glass-btn" style={{ borderRadius: '10px', padding: '8px 20px', fontSize: '13px', fontWeight: '700' }}>
                    {adjusting ? 'Saving...' : 'Save Stock Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
