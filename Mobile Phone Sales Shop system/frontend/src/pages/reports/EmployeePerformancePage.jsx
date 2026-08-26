import React, { useState, useEffect } from 'react';
import { ShieldCheck, Printer, ArrowLeft, Filter, PieChart, BarChart2, Layers, Award, AlertTriangle, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import AdminLayout from '../../components/AdminLayout';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function EmployeePerformancePage() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (roleFilter) params.append('role_filter', roleFilter);
      params.append('page', page);
      params.append('limit', 10);

      const res = await fetch(`${API_URL}/reports/employee-performance?${params.toString()}`, {
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
  const topStaff = data?.staffAll?.slice(0, 7) || [];

  const barData = topStaff.length > 0 ? {
    labels: topStaff.map(s => `${s.first_name} ${s.last_name}`),
    datasets: [
      {
        label: 'Sales Revenue (LKR)',
        data: topStaff.map(s => s.sales_revenue),
        backgroundColor: '#6366f1',
        borderRadius: 6
      },
      {
        label: 'Repair Service Revenue (LKR)',
        data: topStaff.map(s => s.repair_revenue),
        backgroundColor: '#10b981',
        borderRadius: 6
      }
    ]
  } : null;

  const doughnutData = topStaff.length > 0 ? {
    labels: topStaff.map(s => `${s.first_name} ${s.last_name}`),
    datasets: [{
      data: topStaff.map(s => s.sales_count + s.repairs_count),
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#ef4444'],
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
          <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Staff Performance Evaluation</span>
        </nav>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={28} style={{ color: '#818cf8' }} /> Staff Productivity & Evaluation Ledger
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Sales handled, repair services completed, total revenue generated, and client feedback ratings. | Generated: {new Date().toLocaleString()}
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

        {/* HR Highlights Alert Banner */}
        {((data?.summary?.starPerformer && data.summary.starPerformerRev > 0) || (data?.summary?.lowRatingStaff && data.summary.lowRatingStaff.length > 0)) && (
          <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', borderLeft: '4px solid #6366f1', background: 'rgba(99,102,241,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
              <Award size={18} /> HR Evaluation Summary
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0 }}>
              {data?.summary?.starPerformer && data.summary.starPerformerRev > 0 && (
                <span>Top Financial Contributor: <strong>{data.summary.starPerformer}</strong> (Rs. {data.summary.starPerformerRev.toLocaleString()}). </span>
              )}
              {data?.summary?.lowRatingStaff && data.summary.lowRatingStaff.length > 0 && (
                <span>Staff recommended for customer service training (&lt; 4.0 rating): <strong>{data.summary.lowRatingStaff.join(', ')}</strong>.</span>
              )}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Role Filter</label>
              <select className="custom-glass-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Sales person">Sales Person</option>
                <option value="Technician">Technician</option>
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
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Staff Revenue Contribution</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#6366f1', marginTop: '6px' }}>
              Rs. {data?.summary?.totalRevenueStaff?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sales + Repair Income</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Completed Repairs</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>
              {data?.summary?.totalRepairsStaff || 0} repairs
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Technician service volume</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Star Performer</span>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b', marginTop: '6px' }}>
              {data?.summary?.starPerformer || 'N/A'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Highest financial output</span>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: '#6366f1' }} /> Revenue Generation by Staff (LKR)
            </h3>
            <div style={{ height: '240px' }}>
              {barData ? (
                <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: 'rgba(255,255,255,0.7)' } } }, scales: { x: { ticks: { color: 'rgba(255,255,255,0.5)' } }, y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.5)' } } } }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No staff data</span>}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} style={{ color: '#10b981' }} /> Workload Task Distribution
            </h3>
            <div style={{ height: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {doughnutData ? (
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)' } } } }} />
              ) : <span style={{ color: 'var(--text-muted)' }}>No workload data</span>}
            </div>
          </div>
        </div>

        {/* Table Ledger */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: '#6366f1' }} /> Staff Productivity Evaluation Ledger
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading staff evaluation data...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '12px 16px' }}>Employee Name</th>
                    <th style={{ padding: '12px 16px' }}>Role / Department</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Sales Orders</th>
                    <th style={{ padding: '12px 16px' }}>Sales Revenue</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Repairs Serviced</th>
                    <th style={{ padding: '12px 16px' }}>Total Revenue Output</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Average Rating</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Evaluation Class</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.staff && data.staff.length > 0 ? (
                    data.staff.map((st) => (
                      <tr key={st.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700' }}>
                          {st.first_name} {st.last_name}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                            {st.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
                            {st.sales_count} orders
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#818cf8', fontWeight: '600' }}>
                          Rs. {parseFloat(st.sales_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
                            {st.repairs_count} repairs
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: '700' }}>
                          Rs. {parseFloat(st.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#f59e0b', fontWeight: '700' }}>
                          {st.feedback_count > 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Star size={14} style={{ fill: '#f59e0b' }} /> {st.avg_rating.toFixed(1)}
                            </span>
                          ) : 'No reviews'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {st.total_revenue >= 100000 || (st.avg_rating >= 4.5 && st.feedback_count > 0) ? (
                            <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                              Star Performer
                            </span>
                          ) : st.feedback_count > 0 && st.avg_rating < 4.0 ? (
                            <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                              Needs Training
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '12px' }}>
                              Active Duty
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No staff records found matching filter criteria.
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
