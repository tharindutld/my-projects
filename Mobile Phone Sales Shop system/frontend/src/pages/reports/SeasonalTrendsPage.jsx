import React, { useState, useEffect } from 'react';
import { Calendar, Printer, ArrowLeft, Filter, PieChart, BarChart2, Layers, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import AdminLayout from '../../components/AdminLayout';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function SeasonalTrendsPage() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('monthly');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterYear) params.append('filter_year', filterYear);
      params.append('page', page);
      params.append('limit', 10);

      const res = await fetch(`${API_URL}/reports/seasonal-trends?${params.toString()}`, {
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
  }, [token, user, authLoading, filterYear, page]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReport();
  };

  // Monthly Line/Bar Combo Chart
  const monthlyTrends = data?.monthlyTrends ? [...data.monthlyTrends].reverse() : [];

  const lineData = monthlyTrends.length > 0 ? {
    labels: monthlyTrends.map(m => m.month_name),
    datasets: [
      {
        type: 'line',
        label: 'Monthly Revenue (LKR)',
        data: monthlyTrends.map(m => m.MonthlyRevenue),
        borderColor: '#818cf8',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Orders Volume',
        data: monthlyTrends.map(m => m.TotalOrders),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderRadius: 4,
        yAxisID: 'y1'
      }
    ]
  } : null;

  // Weekly Bar Chart
  const weeklyAll = data?.weeklyTrendsAll ? [...data.weeklyTrendsAll].reverse() : [];
  const weeklyData = weeklyAll.length > 0 ? {
    labels: weeklyAll.map(w => `Week ${w.SalesWeek}`),
    datasets: [{
      label: 'Weekly Sales Revenue (LKR)',
      data: weeklyAll.map(w => w.WeeklyRevenue),
      backgroundColor: '#818cf8',
      borderRadius: 4
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
          <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Seasonal Trends & Peak Cycles</span>
        </nav>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={28} style={{ color: '#818cf8' }} /> Seasonal Demand & Cyclical Revenue Spikes
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Weekly and monthly revenue performance, peak season spikes, and slower period troughs. | Generated: {new Date().toLocaleString()}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Filter Year</label>
              <select className="custom-glass-input" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                {data?.availableYears && data.availableYears.length > 0 ? (
                  data.availableYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))
                ) : (
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                )}
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
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #818cf8' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Monthly Average Revenue</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#818cf8', marginTop: '6px' }}>
              Rs. {data?.summary?.avgMonthlyRev?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average monthly baseline</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Peak Season Spike</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>
              Rs. {data?.summary?.maxRev?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Highest monthly revenue</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Slower Period Trough</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', marginTop: '6px' }}>
              Rs. {data?.summary?.minRev?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lowest monthly revenue</span>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: '#818cf8' }} /> Monthly Revenue & Order Volume Trend
            </h3>
            <div style={{ height: '240px' }}>
              {lineData ? (
                <Line data={lineData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top', labels: { color: 'rgba(255,255,255,0.7)' } } },
                  scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.5)' } },
                    y: { type: 'linear', display: true, position: 'left', ticks: { color: 'rgba(255,255,255,0.5)' } },
                    y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#10b981' } }
                  }
                }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No monthly trend data</span>}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: '#10b981' }} /> Weekly Sales Pattern
            </h3>
            <div style={{ height: '240px' }}>
              {weeklyData ? (
                <Bar data={weeklyData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: 'rgba(255,255,255,0.5)' } }, y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.5)' } } } }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No weekly trend data</span>}
            </div>
          </div>
        </div>

        {/* Tab Buttons & Ledger */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: '#818cf8' }} /> Seasonal Trend Ledger ({filterYear})
            </h3>
            <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setActiveTab('monthly'); setPage(1); }} className={`glass-btn ${activeTab === 'monthly' ? '' : 'glass-btn-secondary'}`} style={{ padding: '6px 16px', fontSize: '12px' }}>
                Monthly View
              </button>
              <button onClick={() => { setActiveTab('weekly'); setPage(1); }} className={`glass-btn ${activeTab === 'weekly' ? '' : 'glass-btn-secondary'}`} style={{ padding: '6px 16px', fontSize: '12px' }}>
                Weekly Breakdown
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading seasonal trends data...</div>
          ) : activeTab === 'monthly' ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '12px 16px' }}>Year / Month</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Orders Completed</th>
                    <th style={{ padding: '12px 16px' }}>Monthly Sales Revenue</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Baseline Deviation %</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Season Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.monthlyTrends && data.monthlyTrends.length > 0 ? (
                    data.monthlyTrends.map((m, i) => {
                      const avg = data.summary.avgMonthlyRev || 1;
                      const dev = ((m.MonthlyRevenue - avg) / avg) * 100;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '700' }}>
                            {m.month_name} {m.SalesYear}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                              {m.TotalOrders} orders
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#818cf8', fontWeight: '700' }}>
                            Rs. {m.MonthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: dev >= 0 ? '#10b981' : '#ef4444' }}>
                            {dev >= 0 ? `+${dev.toFixed(1)}%` : `${dev.toFixed(1)}%`}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {m.MonthlyRevenue === data.summary.maxRev ? (
                              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                                Peak Month
                              </span>
                            ) : m.MonthlyRevenue === data.summary.minRev ? (
                              <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                                Slow Period
                              </span>
                            ) : (
                              <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                                Standard Season
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No monthly seasonal data found for {filterYear}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '12px 16px' }}>Calendar Week Number</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Orders Placed</th>
                    <th style={{ padding: '12px 16px' }}>Weekly Sales Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.weeklyTrends && data.weeklyTrends.length > 0 ? (
                    data.weeklyTrends.map((w, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700' }}>Calendar Week #{w.SalesWeek}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                            {w.TotalOrders} orders
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: '700' }}>
                          Rs. {w.WeeklyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No weekly trend records found for {filterYear}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Weekly Pagination */}
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
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
