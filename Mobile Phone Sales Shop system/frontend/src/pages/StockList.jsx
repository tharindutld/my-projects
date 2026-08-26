import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Layers, Smartphone, AlertTriangle, QrCode, Search, Filter, PlusCircle, Edit3, Trash2, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, X, Grid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';

export default function StockList() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [batches, setBatches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [kpis, setKpis] = useState({ totalBatches: 0, totalUnits: 0, lowStockCount: 0, availableImeis: 0 });

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const limit = 10;
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [selectedImeiBatch, setSelectedImeiBatch] = useState(null); // { batchNumber, productName, imeis }
  const [editingBatch, setEditingBatch] = useState(null); // { id, batchNumber, costPrice, sellingPrice, dealer }
  const [deletingBatch, setDeletingBatch] = useState(null); // { id, batchNumber, quantity }

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

    fetchStockList();
    fetchBrands();
  }, [token, user, authLoading, searchParams]);

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_URL}/products/brands`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setBrands(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockList = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (selectedBrand) params.append('brand', selectedBrand);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await fetch(`${API_URL}/stock/list?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setBatches(data.items || []);
        setTotalRows(data.totalRows || 0);
        setTotalPages(data.totalPages || 1);
        if (data.kpis) setKpis(data.kpis);
      } else {
        setErrorMsg('Failed to fetch stock batch list.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    if (e) e.preventDefault();
    const newParams = { page: '1' };
    if (searchTerm) newParams.search = searchTerm;
    if (selectedBrand) newParams.brand = selectedBrand;
    if (selectedStatus) newParams.status = selectedStatus;
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBrand('');
    setSelectedStatus('');
    setSearchParams({ page: '1' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingBatch) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_URL}/stock/batch/${editingBatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cost_price: editingBatch.costPrice,
          selling_price: editingBatch.sellingPrice,
          dealer: editingBatch.dealer
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Batch details updated successfully.');
        setEditingBatch(null);
        fetchStockList();
      } else {
        setErrorMsg(data.message || 'Failed to update batch details.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server error updating batch.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBatch) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_URL}/stock/batch/${deletingBatch.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Batch deleted successfully.');
        setDeletingBatch(null);
        fetchStockList();
      } else {
        setErrorMsg(data.message || 'Failed to delete batch.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server error deleting batch.');
    }
  };

  const parseImeis = (rawStr) => {
    if (!rawStr) return [];
    return rawStr.split(',').map(item => {
      const parts = item.split(':');
      return {
        primary: parts[0] || 'N/A',
        status: parts[1] || 'Available',
        serial: parts[2] || ''
      };
    });
  };

  return (
    <AdminLayout>
      <div className="container-fluid p-4 animate-fade-in">
        {/* Top Navigation / Header */}
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
            }}>Inventory Management</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={28} className="text-primary" /> Inventory Batch Stock List
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/admin/inventory" className="glass-btn-secondary" style={{ borderRadius: '12px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Grid size={16} /> Catalog View
            </Link>
            <Link to="/admin/add-stock" className="glass-btn" style={{ borderRadius: '12px', padding: '10px 18px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PlusCircle size={16} /> Receive New Batch Stock
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

        {/* KPI Cards Grid */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Batches</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>{kpis.totalBatches}</div>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', padding: '12px', borderRadius: '50%' }}>
                <Box size={22} />
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Units in Stock</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>{kpis.totalUnits} <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>units</span></div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '12px', borderRadius: '50%' }}>
                <Smartphone size={22} />
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Low Stock Alert</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fbbf24', marginTop: '4px' }}>{kpis.lowStockCount} <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>batches</span></div>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '12px', borderRadius: '50%' }}>
                <AlertTriangle size={22} />
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active Available IMEIs</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>{kpis.availableImeis}</div>
              </div>
              <div style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '12px', borderRadius: '50%' }}>
                <QrCode size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel" style={{ borderRadius: '16px', padding: '18px', marginBottom: '24px', background: 'rgba(15, 23, 42, 0.75)' }}>
          <form onSubmit={handleFilterSubmit} className="row g-2 align-items-center">
            <div className="col-md-6">
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Search 15-Digit IMEI, Brand, Model, or Batch #..."
                  className="glass-input"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingLeft: '38px', borderRadius: '10px', fontSize: '13px', fontFamily: 'monospace' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="col-md-3">
              <select
                className="glass-input"
                value={selectedBrand}
                onChange={e => { setSelectedBrand(e.target.value); handleFilterSubmit(); }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', fontSize: '13px', background: 'rgba(15,23,42,0.9)' }}
              >
                <option value="">All Brands</option>
                {brands.map(b => (
                  <option key={b.ID} value={b.BrandName}>{b.BrandName}</option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <select
                className="glass-input"
                value={selectedStatus}
                onChange={e => { setSelectedStatus(e.target.value); handleFilterSubmit(); }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', fontSize: '13px', background: 'rgba(15,23,42,0.9)' }}
              >
                <option value="">Stock Status</option>
                <option value="in-stock">In Stock (&gt;5)</option>
                <option value="low">Low Stock (1-5)</option>
                <option value="out">Out of Stock (0)</option>
              </select>
            </div>

            <div className="col-md-1 text-end">
              {(searchTerm || selectedBrand || selectedStatus) && (
                <button type="button" onClick={handleResetFilters} className="glass-btn-secondary" style={{ width: '100%', padding: '9px', borderRadius: '10px', fontSize: '13px' }} title="Reset Filters">
                  <X size={16} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Batch Data Table Container */}
        <div className="glass-panel" style={{ borderRadius: '20px', padding: '24px', background: 'rgba(15, 23, 42, 0.75)' }}>
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 16px' }}>Device Specifications</th>
                  <th style={{ padding: '14px 16px' }}>Batch &amp; Supplier</th>
                  {isAdmin && <th style={{ padding: '14px 16px' }}>Cost Price</th>}
                  <th style={{ padding: '14px 16px' }}>Selling Price</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Current Qty</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Registered IMEIs</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading stock batches...
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No stock batches found.
                    </td>
                  </tr>
                ) : (
                  batches.map(row => {
                    const remaining = parseInt(row.CurrentQuantity || 0, 10);
                    const imeisList = parseImeis(row.batch_imeis);

                    return (
                      <tr key={row.ID} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#fff' }}>{row.ProductName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', marginRight: '6px' }}>{row.BrandName}</span>
                            {row.Color} • {row.ROM} / {row.RAM}
                            <span style={{ color: 'var(--primary)', marginLeft: '6px', fontWeight: '600' }}>({row.SimType})</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }}>{row.BatchNumber}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.Dealer}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.PurchaseDate ? new Date(row.PurchaseDate).toLocaleDateString() : ''}</div>
                        </td>

                        {isAdmin && (
                          <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-muted)' }}>
                            LKR {parseFloat(row.CostPrice || 0).toLocaleString()}
                          </td>
                        )}

                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#fff' }}>
                          LKR {parseFloat(row.SellingPrice || 0).toLocaleString()}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: '12px', fontWeight: '800' }}>
                            {remaining} / {row.InitialQuantity}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {imeisList.length > 0 ? (
                            <button
                              onClick={() => setSelectedImeiBatch({
                                batchNumber: row.BatchNumber,
                                productName: `${row.ProductName} - ${row.Color}`,
                                categoryName: row.CategoryName,
                                imeis: imeisList
                              })}
                              className="glass-btn-secondary"
                              style={{ padding: '4px 12px', borderRadius: '14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <QrCode size={13} /> {row.CategoryName === 'Tablet' ? 'Serials' : 'IMEIs'} ({imeisList.length})
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No IMEIs</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {remaining > 5 ? (
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>In Stock</span>
                          ) : remaining > 0 ? (
                            <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>Low Stock</span>
                          ) : (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>Out of Stock</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          {isAdmin ? (
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => setEditingBatch({
                                  id: row.ID,
                                  batchNumber: row.BatchNumber,
                                  costPrice: row.CostPrice,
                                  sellingPrice: row.SellingPrice,
                                  dealer: row.Dealer
                                })}
                                className="glass-btn-secondary"
                                style={{ padding: '6px', borderRadius: '8px' }}
                                title="Edit Batch"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => setDeletingBatch({
                                  id: row.ID,
                                  batchNumber: row.BatchNumber,
                                  quantity: remaining
                                })}
                                className="glass-btn-danger"
                                style={{ padding: '6px', borderRadius: '8px' }}
                                title="Delete Batch"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
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
                onClick={() => setSearchParams({ page: (currentPage - 1).toString(), search: searchTerm, brand: selectedBrand, status: selectedStatus })}
                className="glass-btn-secondary"
                style={{ borderRadius: '8px', padding: '6px 12px', opacity: currentPage <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setSearchParams({ page: p.toString(), search: searchTerm, brand: selectedBrand, status: selectedStatus })}
                  className={currentPage === p ? 'glass-btn' : 'glass-btn-secondary'}
                  style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '13px', minWidth: '34px' }}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setSearchParams({ page: (currentPage + 1).toString(), search: searchTerm, brand: selectedBrand, status: selectedStatus })}
                className="glass-btn-secondary"
                style={{ borderRadius: '8px', padding: '6px 12px', opacity: currentPage >= totalPages ? 0.4 : 1 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* View IMEIs Modal */}
        {selectedImeiBatch && (
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
            <div className="glass-panel" style={{ width: '100%', maxWidth: '650px', padding: '28px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.95)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>
                    Registered Device IMEIs
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {selectedImeiBatch.productName} • <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{selectedImeiBatch.batchNumber}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedImeiBatch(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ maxHeight: '350px', overflowY: 'auto', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 14px', width: '40px' }}>#</th>
                      <th style={{ padding: '10px 14px' }}>IMEI / Serial Number</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedImeiBatch.imeis.map((im, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: '600', color: '#fff' }}>
                          {im.serial && im.primary !== im.serial ? (
                            <div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>S/N:</span> {im.serial}</div>
                              <div><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IMEI:</span> {im.primary}</div>
                            </div>
                          ) : (
                            im.primary
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {im.status === 'Available' ? (
                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>Available</span>
                          ) : im.status === 'Sold' ? (
                            <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>Sold</span>
                          ) : (
                            <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{im.status}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button onClick={() => setSelectedImeiBatch(null)} className="glass-btn-secondary" style={{ borderRadius: '10px', padding: '8px 20px', fontSize: '13px' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Batch Modal */}
        {editingBatch && (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>
                  Edit Stock Batch Details
                </h3>
                <button onClick={() => setEditingBatch(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Batch Code</label>
                  <input type="text" className="glass-input" value={editingBatch.batchNumber} readOnly style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px', fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Cost Price (Per Unit LKR) *</label>
                  <input type="number" min="1" step="1" className="glass-input" value={editingBatch.costPrice} onChange={e => setEditingBatch({ ...editingBatch, costPrice: e.target.value })} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Selling Price (LKR) *</label>
                  <input type="number" min="10000" step="1" className="glass-input" value={editingBatch.sellingPrice} onChange={e => setEditingBatch({ ...editingBatch, sellingPrice: e.target.value })} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Dealer / Supplier *</label>
                  <input type="text" className="glass-input" value={editingBatch.dealer} onChange={e => setEditingBatch({ ...editingBatch, dealer: e.target.value })} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setEditingBatch(null)} className="glass-btn-secondary" style={{ borderRadius: '10px', padding: '8px 16px', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn" style={{ borderRadius: '10px', padding: '8px 20px', fontSize: '13px', fontWeight: '700' }}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deletingBatch && (
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
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f87171', marginBottom: '12px' }}>
                Delete Stock Batch?
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
                Are you sure you want to delete batch <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{deletingBatch.batchNumber}</strong>?
                This will subtract its remaining stock (<strong>{deletingBatch.quantity} units</strong>) from product inventory.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setDeletingBatch(null)} className="glass-btn-secondary" style={{ borderRadius: '10px', padding: '8px 16px', fontSize: '13px' }}>
                  Cancel
                </button>
                <button onClick={handleDeleteConfirm} className="glass-btn-danger" style={{ borderRadius: '10px', padding: '8px 20px', fontSize: '13px', fontWeight: '700' }}>
                  Delete Batch
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
