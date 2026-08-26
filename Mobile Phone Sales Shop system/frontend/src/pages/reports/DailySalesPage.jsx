import React, { useState, useEffect } from 'react';
import { TrendingUp, Printer, ArrowLeft, Filter, DollarSign, PieChart, BarChart2, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import AdminLayout from '../../components/AdminLayout';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DailySalesPage() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (paymentMethod) params.append('payment_method', paymentMethod);
      params.append('page', page);
      params.append('limit', 10);

      const res = await fetch(`${API_URL}/reports/daily-sales?${params.toString()}`, {
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

  // Charts Config
  const doughnutData = data?.paymentModeDist ? {
    labels: data.paymentModeDist.map(p => p.PaymentMethod || 'Unspecified'),
    datasets: [{
      data: data.paymentModeDist.map(p => parseFloat(p.ModeRevenue || 0)),
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'],
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 2
    }]
  } : null;

  const barData = data?.hourlySales ? {
    labels: data.hourlySales.map(h => `${h.HourLabel}:00`),
    datasets: [{
      label: 'Hourly Sales Revenue (LKR)',
      data: data.hourlySales.map(h => parseFloat(h.HourlyRevenue || 0)),
      backgroundColor: '#6366f1',
      borderRadius: 6
    }]
  } : null;

  return (
    <AdminLayout>
      <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
        {/* Print Styles */}
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
          <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Daily Sales Report</span>
        </nav>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={28} style={{ color: '#10b981' }} /> Daily Sales & Financial Breakdown
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Billed revenue, product costs, payment methods, and net sales profit metrics. | Generated: {new Date().toLocaleString()}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Date From</label>
              <input type="date" className="custom-glass-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Date To</label>
              <input type="date" className="custom-glass-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Payment Mode</label>
              <select className="custom-glass-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="">All Payment Modes</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card / Debit</option>
                <option value="Online">Online Transfer</option>
                <option value="Bank Transfer">Bank Transfer</option>
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
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Billed Sales Revenue</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#6366f1', marginTop: '6px' }}>
              Rs. {data?.summary?.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gross sales revenue</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Billed Product Cost</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', marginTop: '6px' }}>
              Rs. {data?.summary?.totalCost?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Batch buying cost</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Net Sales Profit</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>
              Rs. {data?.summary?.netProfit?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Billed margin gain</span>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} style={{ color: '#6366f1' }} /> Payment Mode Share
            </h3>
            <div style={{ height: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {doughnutData ? (
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)' } } } }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No payment data</span>}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: '#10b981' }} /> Hourly Sales Distribution
            </h3>
            <div style={{ height: '240px' }}>
              {barData ? (
                <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: 'rgba(255,255,255,0.5)' } }, y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.5)' } } } }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No hourly data</span>}
            </div>
          </div>
        </div>

        {/* Table Ledger */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: '#6366f1' }} /> Sales Transaction Ledger
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading sales records...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '12px 16px' }}>Order ID</th>
                    <th style={{ padding: '12px 16px' }}>Date & Time</th>
                    <th style={{ padding: '12px 16px' }}>Customer Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Items</th>
                    <th style={{ padding: '12px 16px' }}>Payment Mode</th>
                    <th style={{ padding: '12px 16px' }}>Gross Revenue</th>
                    <th style={{ padding: '12px 16px' }}>Product Cost</th>
                    <th style={{ padding: '12px 16px' }}>Net Profit</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.orders && data.orders.length > 0 ? (
                    data.orders.map((ord) => (
                      <tr key={ord.ID} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700' }}>#{ord.ID}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                          {new Date(ord.OrderDate).toLocaleDateString()} {new Date(ord.OrderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                          {ord.FirstName ? `${ord.FirstName} ${ord.LastName || ''}` : 'Guest Customer'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px' }}>{ord.totalItemsCount}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                            {ord.PaymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#818cf8', fontWeight: '600' }}>
                          Rs. {parseFloat(ord.TotalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#ef4444' }}>
                          Rs. {parseFloat(ord.orderCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: '700' }}>
                          Rs. {parseFloat(ord.netProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                            {ord.OrderStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No daily sales transactions found.
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
