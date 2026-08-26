import React, { useState, useEffect } from 'react';
import { Users, Printer, ArrowLeft, Filter, PieChart, BarChart2, Layers, Search, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import AdminLayout from '../../components/AdminLayout';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CustomerBehaviorPage() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [minLoyalty, setMinLoyalty] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (minSpend) params.append('min_spend', minSpend);
      if (minLoyalty) params.append('min_loyalty', minLoyalty);
      params.append('page', page);
      params.append('limit', 10);

      const res = await fetch(`${API_URL}/reports/customer-behavior?${params.toString()}`, {
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

  // Top Customers Lifetime Spend Bar Chart
  const topCust = data?.customers?.slice(0, 7) || [];
  const barData = topCust.length > 0 ? {
    labels: topCust.map(c => `${c.FirstName} ${c.LastName || ''}`),
    datasets: [{
      label: 'Lifetime Spend (LKR)',
      data: topCust.map(c => c.TotalSpend),
      backgroundColor: '#06b6d4',
      borderRadius: 6
    }]
  } : null;

  // Brand Preference Share Doughnut Chart
  const brandCounts = {};
  data?.customers?.forEach(c => {
    if (c.fav_brand && c.fav_brand !== 'N/A') {
      brandCounts[c.fav_brand] = (brandCounts[c.fav_brand] || 0) + 1;
    }
  });

  const doughnutData = Object.keys(brandCounts).length > 0 ? {
    labels: Object.keys(brandCounts),
    datasets: [{
      data: Object.values(brandCounts),
      backgroundColor: ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
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
          <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Customer Behavior Intelligence</span>
        </nav>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={28} style={{ color: '#06b6d4' }} /> Customer Purchasing Behavior Leaderboard
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Customer lifetime spend leaderboards, order frequency, loyalty points, and favorite brand preferences. | Generated: {new Date().toLocaleString()}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Search Customer Name</label>
              <input type="text" className="custom-glass-input" placeholder="e.g. John" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Min Lifetime Spend (LKR)</label>
              <input type="number" className="custom-glass-input" placeholder="e.g. 50000" value={minSpend} onChange={e => setMinSpend(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Min Loyalty Points</label>
              <input type="number" className="custom-glass-input" placeholder="e.g. 100" value={minLoyalty} onChange={e => setMinLoyalty(e.target.value)} />
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
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #06b6d4' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Total Store Revenue</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#06b6d4', marginTop: '6px' }}>
              Rs. {data?.summary?.totalSpendAll?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cumulated client spending</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Total Loyalty Points</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', marginTop: '6px' }}>
              {data?.summary?.totalLoyalty || 0} pts
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Accumulated client reward points</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Avg Spending / Order</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>
              Rs. {data?.summary?.overallAvg?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average order basket value</span>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: '#06b6d4' }} /> Top Customers Lifetime Spend (LKR)
            </h3>
            <div style={{ height: '240px' }}>
              {barData ? (
                <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: 'rgba(255,255,255,0.5)' } }, y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.5)' } } } }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No customer data</span>}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} style={{ color: '#f59e0b' }} /> Customer Brand Preference Share
            </h3>
            <div style={{ height: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {doughnutData ? (
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)' } } } }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No brand preference data</span>}
            </div>
          </div>
        </div>

        {/* Table Ledger */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: '#06b6d4' }} /> Customer Activity Leaderboard
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading customer data...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Customer Name</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Email Address</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Orders Placed</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Total Spend</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Average Order Value</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Favorite Brand</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Purchase Freq</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Loyalty Points</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.customers && data.customers.length > 0 ? (
                    data.customers.map((c) => (
                      <tr key={c.ID} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {c.FirstName} {c.LastName || ''}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{c.Email}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: '12px', fontWeight: '700', whiteSpace: 'nowrap', display: 'inline-block' }}>
                            {c.TotalOrders} {c.TotalOrders === 1 ? 'order' : 'orders'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#06b6d4', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          Rs. {parseFloat(c.TotalSpend || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          Rs. {parseFloat(c.AvgSpend || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                            {c.fav_brand}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {c.orders_per_month.toFixed(1)} / mo
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 12px', borderRadius: '12px', fontWeight: '700', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                            <Award size={14} /> {c.LoyaltyPoints || 0} pts
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No customer behavior records found matching filters.
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
