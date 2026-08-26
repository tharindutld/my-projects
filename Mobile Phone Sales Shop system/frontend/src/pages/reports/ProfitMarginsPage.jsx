import React, { useState, useEffect } from 'react';
import { Percent, Printer, ArrowLeft, Filter, PieChart, BarChart2, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import AdminLayout from '../../components/AdminLayout';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ProfitMarginsPage() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [marginTier, setMarginTier] = useState('');
  const [minMargin, setMinMargin] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (marginTier) params.append('margin_tier', marginTier);
      if (minMargin) params.append('min_margin', minMargin);
      params.append('page', page);
      params.append('limit', 10);

      const res = await fetch(`${API_URL}/reports/profit-margins?${params.toString()}`, {
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
    labels: ['High Margin (≥25%)', 'Standard (15-24%)', 'Low Profit (<15%)'],
    datasets: [{
      data: [data.summary.highMarginCount, data.summary.standardCount, data.summary.lowProfitCount],
      backgroundColor: ['#10b981', '#0284c7', '#f59e0b'],
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 2
    }]
  } : null;

  const topItems = data?.items?.slice(0, 7) || [];
  const barData = topItems.length > 0 ? {
    labels: topItems.map(i => `${i.ProductName} (${i.ModelNumber})`),
    datasets: [{
      label: 'Profit Margin (%)',
      data: topItems.map(i => parseFloat(i.marginPct.toFixed(1))),
      backgroundColor: '#10b981',
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
          <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Profit Margin Analysis</span>
        </nav>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Percent size={28} style={{ color: '#10b981' }} /> Profit Margin Analysis & Markup Tiering
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Margin tier tracking showing buying cost vs retail price, unit profit, and percentages. | Generated: {new Date().toLocaleString()}
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
          <form onSubmit={handleFilterSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Margin Tier</label>
              <select className="custom-glass-input" value={marginTier} onChange={e => setMarginTier(e.target.value)}>
                <option value="">All Tiers</option>
                <option value="High Margin">High Margin (≥ 25%)</option>
                <option value="Standard">Standard (15-24%)</option>
                <option value="Low Profit">Low Profit (&lt; 15%)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Min Margin (%)</label>
              <input type="number" className="custom-glass-input" placeholder="e.g. 20" value={minMargin} onChange={e => setMinMargin(e.target.value)} />
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
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>High Margin Products</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>
              {data?.summary?.highMarginCount || 0} products
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Markup is 25% or greater</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Low Margin Products</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', marginTop: '6px' }}>
              {data?.summary?.lowProfitCount || 0} products
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Markup is under 15%</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Total Catalog Inspected</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#6366f1', marginTop: '6px' }}>
              {data?.summary?.totalInspected || 0} products
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active variants checked</span>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} style={{ color: '#10b981' }} /> Margin Tier Distribution
            </h3>
            <div style={{ height: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {doughnutData ? (
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)' } } } }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No data</span>}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: '#0284c7' }} /> Top Product Profit Margins (%)
            </h3>
            <div style={{ height: '240px' }}>
              {barData ? (
                <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: 'rgba(255,255,255,0.5)' } }, y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.5)', callback: val => `${val}%` } } } }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No product data</span>}
            </div>
          </div>
        </div>

        {/* Table Ledger */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: '#10b981' }} /> Product Profitability Ledger
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading profit margin data...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '12px 16px' }}>Brand & Product Name</th>
                    <th style={{ padding: '12px 16px' }}>Model Number</th>
                    <th style={{ padding: '12px 16px' }}>Buying Cost</th>
                    <th style={{ padding: '12px 16px' }}>Retail Price</th>
                    <th style={{ padding: '12px 16px' }}>Unit Profit</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Cost Source</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Profit Margin %</th>
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
                        <td style={{ padding: '12px 16px', color: '#ef4444' }}>
                          Rs. {parseFloat(item.costPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: '600' }}>
                          Rs. {parseFloat(item.Price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#818cf8', fontWeight: '700' }}>
                          Rs. {parseFloat(item.unitProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                            {item.costType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', fontSize: '14px' }}>
                          {item.marginPct.toFixed(1)}%
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {item.marginTier === 'High Margin' && (
                            <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                              High Margin
                            </span>
                          )}
                          {item.marginTier === 'Low Profit' && (
                            <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                              Low Profit
                            </span>
                          )}
                          {item.marginTier === 'Standard' && (
                            <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                              Standard
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No profit margin records found.
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
