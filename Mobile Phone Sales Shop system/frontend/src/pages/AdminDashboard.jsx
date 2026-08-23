import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Smartphone, TrendingUp, AlertTriangle, Wrench, Plus, CheckCircle, Package, Box, BarChart2, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import AdminLayout from '../components/AdminLayout';

// Register ChartJS modules
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const { user, token, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    kpis: { totalSalesRevenue: 0, completedOrdersCount: 0, pendingRepairsCount: 0, activeStaffCount: 0, lowStockCount: 0 },
    techStats: [],
    charts: { salesTrend: [], brandDistribution: [] }
  });
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLowStockList, setShowLowStockList] = useState(false);

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

    const loadDashboard = async () => {
      try {
        const res = await fetch(`${API_URL}/reports/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDashboardData({
            kpis: data.kpis || { totalSalesRevenue: 0, completedOrdersCount: 0, pendingRepairsCount: 0, activeStaffCount: 0, lowStockCount: 0 },
            techStats: data.techStats || [],
            charts: data.charts || { salesTrend: [], brandDistribution: [] }
          });
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
  }, [token, user, authLoading]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading Administration Panel...
        </div>
      </AdminLayout>
    );
  }

  const { kpis, techStats, charts } = dashboardData;
  const isTechnician = user?.role === 'Technician';
  const isAdmin = user?.role === 'Admin';

  // 1. Line Chart Data (Monthly Revenue Trend)
  const lineChartData = {
    labels: (charts?.salesTrend && charts.salesTrend.length > 0) ? charts.salesTrend.map(t => t.MonthLabel) : ['No Sales Yet'],
    datasets: [{
      label: 'Monthly Revenue (Rs.)',
      data: (charts?.salesTrend && charts.salesTrend.length > 0) ? charts.salesTrend.map(t => parseFloat(t.MonthlyRevenue)) : [0],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      tension: 0.35,
      fill: true,
      pointRadius: 4
    }]
  };

  // 2. Doughnut Chart Data (Brand Distribution)
  const doughnutChartData = {
    labels: (charts?.brandDistribution && charts.brandDistribution.length > 0) ? charts.brandDistribution.map(b => b.BrandName) : ['No Data'],
    datasets: [{
      data: (charts?.brandDistribution && charts.brandDistribution.length > 0) ? charts.brandDistribution.map(b => parseInt(b.StockCount)) : [1],
      backgroundColor: [
        '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4'
      ],
      borderWidth: 0
    }]
  };

  return (
    <AdminLayout>
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LayoutDashboard className="text-primary" size={32} /> System Executive Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            Real-time analytics, inventory metrics, repair status, and quick admin operations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <Link to="/admin/products" className="glass-btn" style={{ borderRadius: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <Plus size={16} /> Add New Phone
              </Link>
              <Link to="/admin/staff" className="glass-btn glass-btn-secondary" style={{ borderRadius: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <Users size={16} /> Manage Staff
              </Link>
            </>
          )}
          <Link to="/admin/repairs" className="glass-btn glass-btn-secondary" style={{ borderRadius: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <Wrench size={16} /> Diagnostics
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '35px'
      }}>
        {/* KPI 1: Sales Revenue */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', padding: '14px', borderRadius: '14px' }}>
            <TrendingUp size={26} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Gross Revenue</div>
            <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '2px' }}>Rs. {parseFloat(kpis?.totalSalesRevenue || 0).toLocaleString()}</div>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '14px', borderRadius: '14px' }}>
            <CheckCircle size={26} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Orders Fulfilled</div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginTop: '2px' }}>{kpis?.completedOrdersCount || 0}</div>
          </div>
        </div>

        {/* KPI 3: Pending Repairs */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', padding: '14px', borderRadius: '14px' }}>
            <Wrench size={26} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Pending Diagnostics</div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginTop: '2px' }}>{kpis?.pendingRepairsCount || 0}</div>
          </div>
        </div>

        {/* KPI 4: Low Stock Alerts */}
        <div
          className="glass-panel"
          onClick={() => setShowLowStockList(!showLowStockList)}
          style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', border: lowStock.length > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : undefined }}
        >
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', padding: '14px', borderRadius: '14px' }}>
            <AlertTriangle size={26} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Low Stock Items</div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginTop: '2px', color: lowStock.length > 0 ? 'var(--danger)' : 'inherit' }}>
              {lowStock.length}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Items Expandable Alert */}
      {showLowStockList && lowStock.length > 0 && (
        <div className="glass-panel animate-fade-in" style={{ padding: '20px', marginBottom: '35px', borderColor: 'var(--danger)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--danger)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> Urgent Inventory Restock Needed
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {lowStock.map(ls => (
              <div key={ls.variantId} className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>{ls.ProductName}</strong>
                  <span style={{ fontSize: '11px', display: 'block', color: 'var(--text-muted)' }}>{ls.Color} &bull; {ls.RAM}/{ls.ROM}</span>
                </div>
                <span style={{ color: 'var(--danger)', fontWeight: '800', fontSize: '14px' }}>{ls.Stock} Left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px',
        marginBottom: '35px'
      }}>
        {/* Line Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={20} className="text-primary" /> Monthly Revenue Overview
          </h3>
          <div style={{ height: '240px' }}>
            <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box size={20} className="text-secondary" /> Brand Inventory Stock Share
          </h3>
          <div style={{ height: '240px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={doughnutChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Technician Load Statistics (If Admin / Sales / Tech view) */}
      {techStats && techStats.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} className="text-accent" /> Technician Repair Performance
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '15px'
          }}>
            {techStats.map(st => (
              <div key={st.id} className="glass-card" style={{ padding: '16px' }}>
                <strong style={{ fontSize: '15px' }}>{st.first_name} {st.last_name}</strong>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Assigned Jobs: <strong>{st.assignedJobsCount}</strong>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--success)', marginTop: '2px' }}>
                  Completed Jobs: <strong>{st.completedJobsCount}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
    </AdminLayout>
  );
}
