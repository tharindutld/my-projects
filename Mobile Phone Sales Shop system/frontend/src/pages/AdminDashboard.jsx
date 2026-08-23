import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Smartphone, TrendingUp, AlertTriangle, Wrench, Plus, CheckCircle, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS modules
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const { user, token, API_URL } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLowStockList, setShowLowStockList] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login?staff=true');
      return;
    }
    if (user && user.role === 'Customer') {
      navigate('/');
      return;
    }

    const loadDashboard = async () => {
      try {
        const res = await fetch(`${API_URL}/reports/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }

        const lowRes = await fetch(`${API_URL}/reports/low-stock`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
    };
    loadDashboard();
  }, [token, user]);

  if (loading || !dashboardData) {
    return <div className="container" style={{ textAlign: 'center', padding: '100px' }}>Loading Administration Panel...</div>;
  }

  const { kpis, techStats, charts } = dashboardData;
  const isTechnician = user?.role === 'Technician';
  const isAdmin = user?.role === 'Admin';

  // 1. Line Chart Data (Monthly Revenue Trend)
  const lineChartData = {
    labels: charts.salesTrend.length > 0 ? charts.salesTrend.map(t => t.MonthLabel) : ['No Sales Yet'],
    datasets: [{
      label: 'Monthly Revenue (Rs.)',
      data: charts.salesTrend.length > 0 ? charts.salesTrend.map(t => parseFloat(t.MonthlyRevenue)) : [0],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.3,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4
    }]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  // 2. Doughnut Chart (Inventory Brand Distribution)
  const doughnutData = {
    labels: charts.brandDistribution.map(b => b.BrandName),
    datasets: [{
      data: charts.brandDistribution.map(b => b.ProductCount),
      backgroundColor: ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#64748b'],
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)'
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 10 }
      }
    },
    cutout: '65%'
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Welcome Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Management Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Logged in as: <strong>{user?.firstName} {user?.lastName}</strong> ({user?.role})
          </p>
        </div>
        <Link to="/" className="glass-btn glass-btn-secondary" style={{ borderRadius: '20px', fontSize: '13px' }}>Go to Storefront</Link>
      </div>

      {/* Low Stock Warn Banner */}
      {lowStock.length > 0 && !isTechnician && (
        <div className="glass-panel" style={{
          borderLeft: '4px solid var(--warning)',
          padding: '20px',
          marginBottom: '30px',
          background: 'rgba(245, 158, 11, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle className="text-warning" size={24} />
              <div>
                <strong style={{ display: 'block', fontSize: '15px' }}>Low Stock Warning</strong>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  There are {lowStock.length} product configurations with less than or equal to 5 units in inventory.
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLowStockList(!showLowStockList)} className="glass-btn glass-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                {showLowStockList ? 'Hide details' : 'View Low Stock Items'}
              </button>
              <Link to="/admin/stock" className="glass-btn" style={{ background: 'var(--warning)', color: '#000', padding: '8px 16px', fontSize: '13px' }}>
                Restock Now
              </Link>
            </div>
          </div>

          {showLowStockList && (
            <div style={{ marginTop: '20px', overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Product & Variant</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Units Left</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((ls, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px' }}>{ls.ProductName} ({ls.Color}, {ls.ROM}/{ls.RAM})</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: ls.Stock === 0 ? 'var(--danger)' : '#fff' }}>{ls.Stock}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          background: ls.Stock === 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: ls.Stock === 0 ? 'var(--danger)' : 'var(--warning)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          {ls.Stock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <Link to="/admin/stock" className="glass-btn glass-btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>Restock</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      {!isTechnician ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {isAdmin && (
            <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Net Revenue</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)', margin: '8px 0' }}>
                Rs. {kpis.salescount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From completed orders</span>
            </div>
          )}

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Orders Placed</span>
            <div style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0' }}>{kpis.ordercount} Orders</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>All transaction states</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--secondary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Products In Catalog</span>
            <div style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0' }}>{kpis.productcount} Items</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active items in catalog</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Registered Users</span>
            <div style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0' }}>{kpis.totuser} Clients</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered customer count</span>
          </div>
        </div>
      ) : (
        // Technician Specific Stats Grid
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Assigned Repairs</span>
            <div style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0' }}>{techStats.tech_total} Jobs</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total repair jobs assigned</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--warning)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Pending Diagnostics</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--warning)', margin: '8px 0' }}>{techStats.tech_pending} Jobs</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Awaiting diagnostics</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--secondary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>In Progress Repairs</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--secondary)', margin: '8px 0' }}>{techStats.tech_inprog} Jobs</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active diagnostic repairs</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Completed Repairs</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)', margin: '8px 0' }}>{techStats.tech_completed} Jobs</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completed / released jobs</span>
          </div>
        </div>
      )}

      {/* Analytics Charts (Admin only) */}
      {!isTechnician && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isAdmin ? '2fr 1fr' : '1fr',
          gap: '30px',
          marginBottom: '40px'
        }}>
          {isAdmin && (
            <div className="glass-panel" style={{ padding: '24px', height: '380px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Monthly Revenue Trend</h3>
              <div style={{ flexGrow: 1, position: 'relative' }}>
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '24px', height: '380px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Inventory by Brand</h3>
            <div style={{ flexGrow: 1, position: 'relative' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Shortcuts Links */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Quick Shortcuts & Actions</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {isAdmin && (
            <>
              <Link to="/admin/products" className="glass-btn glass-btn-secondary" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Smartphone size={24} className="text-primary" />
                <strong>Manage Products</strong>
              </Link>
              <Link to="/admin/staff" className="glass-btn glass-btn-secondary" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Users size={24} className="text-success" />
                <strong>Staff & Customers</strong>
              </Link>
            </>
          )}

          {!isTechnician && (
            <>
              <Link to="/admin/orders" className="glass-btn glass-btn-secondary" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Package size={24} className="text-secondary" />
                <strong>Manage Orders</strong>
              </Link>
              <Link to="/admin/stock" className="glass-btn glass-btn-secondary" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <TrendingUp size={24} className="text-warning" />
                <strong>Receive Stock Batch</strong>
              </Link>
              <Link to="/admin/pricing" className="glass-btn glass-btn-secondary" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <TrendingUp size={24} className="text-accent" />
                <strong>Promotions & Pricing</strong>
              </Link>
            </>
          )}

          <Link to="/admin/repairs" className="glass-btn glass-btn-secondary" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Wrench size={24} className="text-accent" />
            <strong>Repair Diagnostics</strong>
          </Link>
        </div>
      </div>

    </div>
  );
}
