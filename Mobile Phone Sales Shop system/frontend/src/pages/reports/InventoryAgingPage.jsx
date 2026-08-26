import React, { useState, useEffect } from 'react';
import { Package, Printer, ArrowLeft, Filter, PieChart, BarChart2, Layers, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import AdminLayout from '../../components/AdminLayout';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function InventoryAgingPage() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [agingFilter, setAgingFilter] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (agingFilter) params.append('aging_filter', agingFilter);
      params.append('page', page);
      params.append('limit', 10);

      const res = await fetch(`${API_URL}/reports/inventory-aging?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!token || !user || user.role === 'Customer') {
      navigate('/login?staff=true');
      return;
    }
    fetchReport();
  }, [token, user, authLoading, page]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReport();
  };

  // Chart Data
  const doughnutData = data?.summary ? {
    labels: ['Dead Stock (>180d)', 'Slow Moving (90-180d)', 'Healthy Stock (<90d)'],
    datasets: [{
      data: [data.summary.deadStockCount, data.summary.slowMovingCount, data.summary.healthyCount],
      backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 2
    }]
  } : null;

  const deadItems = data?.items?.filter(i => i.status === 'Dead Stock').slice(0, 7) || [];
  const barData = deadItems.length > 0 ? {
    labels: deadItems.map(i => `${i.ProductName} (${i.ModelNumber})`),
    datasets: [{
      label: 'Inventory Valuation (LKR)',
      data: deadItems.map(i => i.stockValuation),
      backgroundColor: '#ef4444',
      borderRadius: 6
    }]
  } : null;

  return (
    <AdminLayout>
      <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: #fff !important; color: #000 !important; }
            .glass-panel, .glass-card { background: #fff !important; border: 1px solid #ccc !important; color: #000 !important; box-shadow: none !important; }
            th, td { color: #000 !important; border-bottom: 1px solid #ddd !important; }
          }
        `}</style>

        {/* Breadcrumbs */}
        <nav className="no-print" style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link> &gt;{' '}
          <Link to="/admin/reports" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Reports</Link> &gt;{' '}
          <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Inventory Aging Analysis</span>
        </nav>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package size={28} style={{ color: '#ef4444' }} /> Inventory Aging & Valuation Analysis
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Track days unsold, slow-moving stock, and critical dead-stock inventory. | Generated: {new Date().toLocaleString()}
            </p>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => window.print()} className="glass-btn" style={{ borderRadius: '20px', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={16} /> Print Report
            </button>
            <button onClick={() => navigate('/admin/reports')} className="glass-btn glass-btn-secondary" style={{ borderRadius: '20px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel no-print" style={{ padding: '20px', marginBottom: '24px' }}>
          <form onSubmit={handleFilterSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Aging Tier Filter</label>
              <select className="custom-glass-input" value={agingFilter} onChange={e => setAgingFilter(e.target.value)}>
                <option value="">All Aging Tiers</option>
                <option value="Dead Stock">Dead Stock (&gt; 180 Days)</option>
                <option value="Slow Moving">Slow Moving (90 - 180 Days)</option>
                <option value="Healthy">Healthy Stock (&lt; 90 Days)</option>
              </select>
            </div>
            <div>
              <button type="submit" className="glass-btn" style={{ width: '100%', height: '42px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Filter size={16} /> Generate Report
              </button>
            </div>
          </form>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Dead Stock (&gt;180 Days)</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', marginTop: '6px' }}>
              {data?.summary?.deadStockCount || 0} items
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Critical liquidation risk</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Slow Moving (90-180 Days)</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', marginTop: '6px' }}>
              {data?.summary?.slowMovingCount || 0} items
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Requires discount strategy</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Total Inventory Valuation</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#6366f1', marginTop: '6px' }}>
              Rs. {data?.summary?.totalValuation?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Capital tied in stock</span>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} style={{ color: '#ef4444' }} /> Aging Distribution
            </h3>
            <div style={{ height: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {doughnutData ? (
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)' } } } }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No data</span>}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: '#f59e0b' }} /> Top Dead Stock Valuations (LKR)
            </h3>
            <div style={{ height: '240px' }}>
              {barData ? (
                <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: 'rgba(255,255,255,0.5)' } }, y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.5)' } } } }} />
              ) : <span style={{ color: 'var(--text-muted)', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>No dead stock items</span>}
            </div>
          </div>
        </div>

        {/* Table Ledger */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: '#ef4444' }} /> Inventory Aging Ledger
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading inventory aging data...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '12px 16px' }}>Brand & Product Name</th>
                    <th style={{ padding: '12px 16px' }}>Model Number</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Stock Qty</th>
                    <th style={{ padding: '12px 16px' }}>Cost Price</th>
                    <th style={{ padding: '12px 16px' }}>Stock Valuation</th>
                    <th style={{ padding: '12px 16px' }}>Last Sale / Entry Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Days Unsold</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items && data.items.length > 0 ? (
                    data.items.map((item) => (
                      <tr key={item.VariantId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>{item.BrandName}</span>
                          <span style={{ fontWeight: '700' }}>{item.ProductName}</span>
                          {(item.Color || item.ROM) && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>
                              {item.Color} ({item.ROM} / {item.RAM})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>{item.ModelNumber}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                            {item.Stock} units
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#ef4444' }}>
                          Rs. {parseFloat(item.costPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#818cf8', fontWeight: '600' }}>
                          Rs. {parseFloat(item.stockValuation || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                          {item.lastSaleDate ? new Date(item.lastSaleDate).toLocaleDateString() : 'No sales recorded'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: item.daysUnsold > 180 ? '#ef4444' : item.daysUnsold >= 90 ? '#f59e0b' : '#10b981' }}>
                          {item.daysUnsold} days
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {item.status === 'Dead Stock' && (
                            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                              Dead Stock
                            </span>
                          )}
                          {item.status === 'Slow Moving' && (
                            <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                              Slow Moving
                            </span>
                          )}
                          {item.status === 'Healthy' && (
                            <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                              Healthy
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No inventory aging records found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="glass-btn" style={{ padding: '6px 14px', fontSize: '12px' }}>
                &laquo; Prev
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                Page {page} of {data.totalPages}
              </span>
              <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className="glass-btn" style={{ padding: '6px 14px', fontSize: '12px' }}>
                Next &raquo;
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
