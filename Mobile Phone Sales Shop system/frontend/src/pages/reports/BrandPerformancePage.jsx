import React, { useState, useEffect } from 'react';
import { Star, Printer, ArrowLeft, Filter, PieChart, BarChart2, Layers, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import AdminLayout from '../../components/AdminLayout';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function BrandPerformancePage() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productName, setProductName] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (productName) params.append('product_name', productName);
      params.append('page', page);
      params.append('limit', 10);

      const res = await fetch(`${API_URL}/reports/brand-performance?${params.toString()}`, {
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
  const topBrands = data?.brandsAll?.slice(0, 7) || [];

  const barData = topBrands.length > 0 ? {
    labels: topBrands.map(b => b.ProductName),
    datasets: [
      {
        label: 'Revenue (LKR)',
        data: topBrands.map(b => b.BrandRevenue),
        backgroundColor: '#f59e0b',
        borderRadius: 6
      },
      {
        label: 'Net Profit (LKR)',
        data: topBrands.map(b => b.brand_profit),
        backgroundColor: '#10b981',
        borderRadius: 6
      }
    ]
  } : null;

  const doughnutData = topBrands.length > 0 ? {
    labels: topBrands.map(b => b.ProductName),
    datasets: [{
      data: topBrands.map(b => b.UnitsSold),
      backgroundColor: ['#f59e0b', '#6366f1', '#10b981', '#06b6d4', '#ec4899', '#8b5cf6', '#ef4444'],
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 2
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
          <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Brand & Product Performance</span>
        </nav>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Star size={28} style={{ color: '#f59e0b' }} /> Product & Brand Performance Analytics
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Revenue contribution, units sold, net profit margins, and warranty claim defect rates. | Generated: {new Date().toLocaleString()}
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

        {/* Supplier Quality Warning Alert */}
        {data?.summary?.highDefectBrands && data.summary.highDefectBrands.length > 0 && (
          <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', borderLeft: '4px solid #ef4444', background: 'rgba(239,68,68,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
              <AlertTriangle size={18} /> Supplier Quality Alert
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0 }}>
              The following products exceed the 5.0% return rate threshold: <strong>{data.summary.highDefectBrands.join(', ')}</strong>. Recommend reviewing supplier warranties or inspection protocols.
            </p>
          </div>
        )}

        {/* Filter Bar */}
        <div className="glass-panel no-print" style={{ padding: '20px', marginBottom: '24px' }}>
          <form onSubmit={handleFilterSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Date From</label>
              <input type="date" className="custom-glass-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Date To</label>
              <input type="date" className="custom-glass-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Product Name</label>
              <select className="custom-glass-input" value={productName} onChange={e => setProductName(e.target.value)}>
                <option value="">All Products</option>
                {data?.allProducts?.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
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
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Total Brands Revenue</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', marginTop: '6px' }}>
              Rs. {data?.summary?.totalRevenueAll?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cumulative product sales</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Total Net Profit</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>
              Rs. {data?.summary?.totalProfitAll?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Net profit gain after batch cost</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Warranty Claims Logged</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', marginTop: '6px' }}>
              {data?.summary?.totalReturnsAll || 0} claims
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total defect & return items</span>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: '#f59e0b' }} /> Revenue vs Profit (LKR)
            </h3>
            <div style={{ height: '240px' }}>
              {barData ? (
                <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: 'rgba(255,255,255,0.7)' } } }, scales: { x: { ticks: { color: 'rgba(255,255,255,0.5)' } }, y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.5)' } } } }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No brand data</span>}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} style={{ color: '#10b981' }} /> Brand Share by Units Sold
            </h3>
            <div style={{ height: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {doughnutData ? (
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)' } } } }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No units data</span>}
            </div>
          </div>
        </div>

        {/* Table Ledger */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: '#f59e0b' }} /> Brand Performance Ledger
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading brand performance data...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '12px 16px' }}>Product Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Units Sold</th>
                    <th style={{ padding: '12px 16px' }}>Total Sales Revenue</th>
                    <th style={{ padding: '12px 16px' }}>Net Profit</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Warranty Returns</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Return Rate %</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Performance Index</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.brands && data.brands.length > 0 ? (
                    data.brands.map((b, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700' }}>{b.ProductName}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                            {b.UnitsSold} units
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: '700' }}>
                          Rs. {parseFloat(b.BrandRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: '600' }}>
                          Rs. {parseFloat(b.brand_profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: b.return_count > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                          {b.return_count} claims
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: b.return_rate > 5.0 ? '#ef4444' : '#10b981' }}>
                          {b.return_rate.toFixed(1)}%
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {b.return_rate <= 2.0 && b.UnitsSold >= 10 ? (
                            <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                              Top Performer
                            </span>
                          ) : b.return_rate > 5.0 ? (
                            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                              High Defect Rate
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                              Standard
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No brand performance records found matching filters.
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
