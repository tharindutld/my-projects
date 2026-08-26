import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Tag, Box, Users, UserCheck, DollarSign, ShoppingCart, 
  AlertTriangle, Wrench, Clock, CheckCircle2, PlusCircle, Plus, 
  ListFilter, ArrowRight, ChevronUp, ChevronDown, BarChart2, PieChart, Zap 
} from 'lucide-react';
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
    kpis: {
      brandcount: 0,
      productcount: 0,
      totuser: 0,
      staffcount: 0,
      salescount: 0,
      ordercount: 0,
      low_stock_count: 0,
      out_stock_count: 0
    },
    techStats: {
      tech_pending: 0,
      tech_inprog: 0,
      tech_completed: 0,
      tech_total: 0
    },
    charts: {
      salesTrend: [],
      brandDistribution: []
    }
  });

  const [lowStockList, setLowStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLowStockDetails, setShowLowStockDetails] = useState(false);

  const fetchDashboardData = async () => {
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
        setLowStockList(lowData);
      }
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

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

    fetchDashboardData();

    // Auto refresh KPIs every 60 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, [token, user, authLoading]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
          Loading Administration Dashboard Metrics...
        </div>
      </AdminLayout>
    );
  }

  const { kpis, techStats, charts } = dashboardData;
  const userRole = user?.role || 'Admin';
  const isTechnician = userRole === 'Technician';
  const isAdmin = userRole === 'Admin';
  const isSalesPerson = userRole === 'Sales person';

  const totalWarningStock = (kpis?.low_stock_count || 0) + (kpis?.out_stock_count || 0);

  // Line Chart Configuration (Monthly Sales Trend)
  const lineChartData = {
    labels: (charts?.salesTrend && charts.salesTrend.length > 0)
      ? charts.salesTrend.map(t => t.MonthLabel)
      : ['No Sales Yet'],
    datasets: [{
      label: 'Monthly Revenue (Rs.)',
      data: (charts?.salesTrend && charts.salesTrend.length > 0)
        ? charts.salesTrend.map(t => parseFloat(t.MonthlyRevenue))
        : [0],
      borderColor: '#38bdf8',
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderWidth: 3,
      fill: true,
      tension: 0.35,
      pointBackgroundColor: '#38bdf8',
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` Revenue: Rs. ${context.raw.toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        ticks: { color: '#cbd5e1' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#cbd5e1' }
      }
    }
  };

  // Doughnut Chart Configuration (Brand Distribution)
  const doughnutChartData = {
    labels: (charts?.brandDistribution && charts.brandDistribution.length > 0)
      ? charts.brandDistribution.map(b => b.BrandName)
      : ['No Data'],
    datasets: [{
      data: (charts?.brandDistribution && charts.brandDistribution.length > 0)
        ? charts.brandDistribution.map(b => parseInt(b.ProductCount))
        : [1],
      backgroundColor: [
        '#38bdf8', '#4ade80', '#fbbf24', '#f87171', '#a855f7', '#64748b'
      ],
      borderColor: '#0f172a',
      borderWidth: 2
    }]
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#cbd5e1', boxWidth: 12, padding: 16 }
      }
    },
    cutout: '65%'
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
        
        {/* Top Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-white fw-bold m-0 d-flex align-items-center gap-2">
              <LayoutDashboard className="text-primary" size={28} /> Management Dashboard
            </h2>
            <p className="small mb-0 mt-1" style={{ color: '#cbd5e1' }}>
              Overview of store activity, sales metrics, repair status, and stock alerts.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span style={{
              background: 'rgba(99,102,241,0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.3)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              Role: {userRole}
            </span>
          </div>
        </div>

        {/* Low / Out of Stock Warning Banner (Collapsible Alert) */}
        {!isTechnician && totalWarningStock > 0 && (
          <div className="glass-card mb-4" style={{
            borderLeft: '4px solid #f59e0b',
            background: 'rgba(245, 158, 11, 0.08)',
            padding: '20px',
            borderRadius: '16px'
          }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div className="d-flex align-items-center gap-3">
                <div style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  padding: '10px',
                  borderRadius: '50%'
                }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h6 className="fw-bold text-white mb-0" style={{ fontSize: '15px' }}>Low Stock Warning</h6>
                  <span style={{ color: '#cbd5e1', fontSize: '13px' }}>
                    <strong style={{ color: '#fbbf24' }}>{totalWarningStock}</strong> product configuration(s) require restocking (&le; 5 units left).
                  </span>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="glass-btn glass-btn-secondary"
                  onClick={() => setShowLowStockDetails(!showLowStockDetails)}
                  style={{ borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {showLowStockDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showLowStockDetails ? 'Hide Low Stock Items' : `View Low Stock Items (${totalWarningStock})`}
                </button>
                <Link
                  to="/admin/inventory"
                  className="glass-btn glass-btn-primary"
                  style={{ borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Box size={16} /> Restock Inventory
                </Link>
              </div>
            </div>

            {/* Expandable Low Stock Table */}
            {showLowStockDetails && (
              <div className="mt-3 pt-3 border-top border-secondary animate-fade-in">
                <div className="table-responsive" style={{ borderRadius: '12px', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.8)' }}>
                  <table className="table table-dark table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(30, 41, 59, 0.9)', color: '#94a3b8', textTransform: 'uppercase', fontSize: '11px' }}>
                        <th className="ps-3 py-2">Product Name & Variant</th>
                        <th className="text-center py-2">Stock Level</th>
                        <th className="text-center py-2">Status</th>
                        <th className="text-end pe-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockList.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-3 text-muted">No low stock items detected.</td>
                        </tr>
                      ) : (
                        lowStockList.map((ls) => {
                          let variantDesc = ls.ProductName;
                          if (ls.Color || ls.ROM) {
                            variantDesc += ` — ${ls.Color || ''} (${ls.ROM || ''} / ${ls.RAM || ''})`;
                          }
                          const isZero = ls.Stock === 0;

                          return (
                            <tr key={ls.VariantId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td className="ps-3 fw-semibold text-light">{variantDesc}</td>
                              <td className={`text-center fw-bold ${isZero ? 'text-danger' : 'text-warning'}`}>
                                {ls.Stock} units left
                              </td>
                              <td className="text-center">
                                {isZero ? (
                                  <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                                    Out of Stock
                                  </span>
                                ) : (
                                  <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                                    Low Stock
                                  </span>
                                )}
                              </td>
                              <td className="text-end pe-3">
                                <Link
                                  to={`/admin/inventory?search=${encodeURIComponent(ls.ProductName)}`}
                                  className="glass-btn glass-btn-primary"
                                  style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px' }}
                                >
                                  Restock
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Row 1: Catalog Metrics (Non-Technician) */}
        {!isTechnician && (
          <div className="row g-4 mb-4">
            {/* Total Brands */}
            <div className="col-md-3">
              <Link to="/admin/manage-brand" className="text-decoration-none">
                <div className="glass-card h-100 p-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #38bdf8' }}>
                  <div>
                    <span className="small fw-semibold text-uppercase d-block mb-1" style={{ color: '#cbd5e1' }}>Total Brands</span>
                    <h3 className="mb-0 fw-bold text-white">{kpis?.brandcount || 0}</h3>
                  </div>
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '12px', borderRadius: '12px' }}>
                    <Tag size={24} />
                  </div>
                </div>
              </Link>
            </div>

            {/* Products In Catalog */}
            <div className="col-md-3">
              <Link to="/admin/manage-product" className="text-decoration-none">
                <div className="glass-card h-100 p-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #4ade80' }}>
                  <div>
                    <span className="small fw-semibold text-uppercase d-block mb-1" style={{ color: '#cbd5e1' }}>Products In Catalog</span>
                    <h3 className="mb-0 fw-bold text-white">{kpis?.productcount || 0}</h3>
                  </div>
                  <div style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', padding: '12px', borderRadius: '12px' }}>
                    <Box size={24} />
                  </div>
                </div>
              </Link>
            </div>

            {/* Registered Users */}
            <div className="col-md-3">
              <Link to="/admin/users" className="text-decoration-none">
                <div className="glass-card h-100 p-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #818cf8' }}>
                  <div>
                    <span className="small fw-semibold text-uppercase d-block mb-1" style={{ color: '#cbd5e1' }}>Registered Users</span>
                    <h3 className="mb-0 fw-bold text-white">{kpis?.totuser || 0}</h3>
                  </div>
                  <div style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', padding: '12px', borderRadius: '12px' }}>
                    <Users size={24} />
                  </div>
                </div>
              </Link>
            </div>

            {/* Active Staff */}
            <div className="col-md-3">
              <Link to="/admin/staff" className="text-decoration-none">
                <div className="glass-card h-100 p-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #fbbf24' }}>
                  <div>
                    <span className="small fw-semibold text-uppercase d-block mb-1" style={{ color: '#cbd5e1' }}>Active Staff</span>
                    <h3 className="mb-0 fw-bold text-white">{kpis?.staffcount || 0}</h3>
                  </div>
                  <div style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '12px', borderRadius: '12px' }}>
                    <UserCheck size={24} />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Row 2: Sales & Stock Warning Metrics (Non-Technician) */}
        {!isTechnician && (
          <div className="row g-4 mb-4">
            {/* Net Revenue (Admin Only) */}
            {isAdmin && (
              <div className="col-md-4">
                <Link to="/admin/reports" className="text-decoration-none">
                  <div className="glass-card h-100 p-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #f87171' }}>
                    <div>
                      <span className="small fw-semibold text-uppercase d-block mb-1" style={{ color: '#cbd5e1' }}>Net Revenue</span>
                      <h3 className="mb-0 fw-bold" style={{ color: '#f87171' }}>
                        Rs. {(kpis?.salescount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                      <span style={{ color: '#cbd5e1', fontSize: '11px' }}>From completed orders</span>
                    </div>
                    <div style={{ background: 'rgba(248, 113, 113, 0.15)', color: '#f87171', padding: '12px', borderRadius: '12px' }}>
                      <DollarSign size={24} />
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Orders Placed */}
            <div className={isAdmin ? 'col-md-4' : 'col-md-6'}>
              <Link to="/admin/orders" className="text-decoration-none">
                <div className="glass-card h-100 p-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #38bdf8' }}>
                  <div>
                    <span className="small fw-semibold text-uppercase d-block mb-1" style={{ color: '#cbd5e1' }}>Orders Placed</span>
                    <h3 className="mb-0 fw-bold text-primary">{kpis?.ordercount || 0}</h3>
                    <span style={{ color: '#cbd5e1', fontSize: '11px' }}>All transaction states</span>
                  </div>
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '12px', borderRadius: '12px' }}>
                    <ShoppingCart size={24} />
                  </div>
                </div>
              </Link>
            </div>

            {/* Stock Warning Level */}
            <div className={isAdmin ? 'col-md-4' : 'col-md-6'}>
              <Link to="/admin/inventory" className="text-decoration-none">
                <div className="glass-card h-100 p-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #fbbf24' }}>
                  <div>
                    <span className="small fw-semibold text-uppercase d-block mb-1" style={{ color: '#cbd5e1' }}>Stock Warning Level</span>
                    <h3 className="mb-0 fw-bold" style={{ color: '#fbbf24' }}>{totalWarningStock} Items</h3>
                    <span style={{ color: '#cbd5e1', fontSize: '11px' }}>{kpis?.out_stock_count || 0} completely out-of-stock</span>
                  </div>
                  <div style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '12px', borderRadius: '12px' }}>
                    <AlertTriangle size={24} />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Technician Repair Stats Row (Technician View) */}
        {isTechnician && (
          <div className="row g-4 mb-4">
            {/* Total Assigned */}
            <div className="col-md-3">
              <Link to="/admin/repairs" className="text-decoration-none">
                <div className="glass-card h-100 p-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #94a3b8' }}>
                  <div>
                    <span className="small fw-semibold text-uppercase d-block mb-1" style={{ color: '#cbd5e1' }}>Total Assigned</span>
                    <h3 className="mb-0 fw-bold text-white">{techStats?.tech_total || 0}</h3>
                  </div>
                  <div style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', padding: '12px', borderRadius: '12px' }}>
                    <Wrench size={24} />
                  </div>
                </div>
              </Link>
            </div>

            {/* Pending */}
            <div className="col-md-3">
              <Link to="/admin/repairs?filter=pending" className="text-decoration-none">
                <div className="glass-card h-100 p-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #fbbf24' }}>
                  <div>
                    <span className="small fw-semibold text-uppercase d-block mb-1" style={{ color: '#cbd5e1' }}>Pending</span>
                    <h3 className="mb-0 fw-bold" style={{ color: '#fbbf24' }}>{techStats?.tech_pending || 0}</h3>
                  </div>
                  <div style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '12px', borderRadius: '12px' }}>
                    <Clock size={24} />
                  </div>
                </div>
              </Link>
            </div>

            {/* In Progress */}
            <div className="col-md-3">
              <Link to="/admin/repairs?filter=in-progress" className="text-decoration-none">
                <div className="glass-card h-100 p-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #38bdf8' }}>
                  <div>
                    <span className="small fw-semibold text-uppercase d-block mb-1" style={{ color: '#cbd5e1' }}>In Progress</span>
                    <h3 className="mb-0 fw-bold" style={{ color: '#38bdf8' }}>{techStats?.tech_inprog || 0}</h3>
                  </div>
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '12px', borderRadius: '12px' }}>
                    <Wrench size={24} />
                  </div>
                </div>
              </Link>
            </div>

            {/* Completed */}
            <div className="col-md-3">
              <Link to="/admin/repairs?filter=completed" className="text-decoration-none">
                <div className="glass-card h-100 p-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #4ade80' }}>
                  <div>
                    <span className="small fw-semibold text-uppercase d-block mb-1" style={{ color: '#cbd5e1' }}>Completed</span>
                    <h3 className="mb-0 fw-bold" style={{ color: '#4ade80' }}>{techStats?.tech_completed || 0}</h3>
                  </div>
                  <div style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', padding: '12px', borderRadius: '12px' }}>
                    <CheckCircle2 size={24} />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Analytics Charts Section (Non-Technician) */}
        {!isTechnician && (
          <div className="row g-4 mb-4">
            {isAdmin ? (
              <>
                <div className="col-lg-8">
                  <div className="glass-card h-100 p-4" style={{ borderRadius: '16px' }}>
                    <h5 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                      <BarChart2 className="text-primary" size={20} /> Monthly Revenue Trend
                    </h5>
                    <div style={{ position: 'relative', height: '280px' }}>
                      <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="glass-card h-100 p-4" style={{ borderRadius: '16px' }}>
                    <h5 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                      <PieChart style={{ color: '#4ade80' }} size={20} /> Inventory by Brand
                    </h5>
                    <div style={{ position: 'relative', height: '280px' }}>
                      <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="col-lg-12">
                <div className="glass-card h-100 p-4" style={{ borderRadius: '16px' }}>
                  <h5 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                    <PieChart style={{ color: '#4ade80' }} size={20} /> Inventory by Brand
                  </h5>
                  <div style={{ position: 'relative', height: '280px' }}>
                    <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Action Shortcuts & Administration Panel */}
        <div className="glass-card p-4" style={{ borderRadius: '16px' }}>
          <h5 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
            <Zap className="text-primary" size={20} /> Quick Actions & Administration Shortcuts
          </h5>
          <div className="row g-3">
            {isAdmin && (
              <>
                <div className="col-md-3 col-sm-6">
                  <Link to="/admin/add-order" className="text-decoration-none">
                    <div className="glass-card text-center p-3 h-100 hover-elevate" style={{ border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.05)' }}>
                      <PlusCircle size={28} className="text-primary mb-2 mx-auto d-block" />
                      <span className="fw-bold text-white d-block" style={{ fontSize: '14px' }}>Create In-Store Order</span>
                    </div>
                  </Link>
                </div>
                <div className="col-md-3 col-sm-6">
                  <Link to="/admin/orders" className="text-decoration-none">
                    <div className="glass-card text-center p-3 h-100 hover-elevate" style={{ border: '1px solid rgba(129, 140, 248, 0.3)', background: 'rgba(129, 140, 248, 0.05)' }}>
                      <ShoppingCart size={28} style={{ color: '#818cf8' }} className="mb-2 mx-auto d-block" />
                      <span className="fw-bold text-white d-block" style={{ fontSize: '14px' }}>View Orders</span>
                    </div>
                  </Link>
                </div>
                <div className="col-md-3 col-sm-6">
                  <Link to="/admin/add-product" className="text-decoration-none">
                    <div className="glass-card text-center p-3 h-100 hover-elevate" style={{ border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.05)' }}>
                      <Plus size={28} className="text-primary mb-2 mx-auto d-block" />
                      <span className="fw-bold text-white d-block" style={{ fontSize: '14px' }}>Add Product</span>
                    </div>
                  </Link>
                </div>
                <div className="col-md-3 col-sm-6">
                  <Link to="/admin/inventory" className="text-decoration-none">
                    <div className="glass-card text-center p-3 h-100 hover-elevate" style={{ border: '1px solid rgba(74, 222, 128, 0.3)', background: 'rgba(74, 222, 128, 0.05)' }}>
                      <Box size={28} style={{ color: '#4ade80' }} className="mb-2 mx-auto d-block" />
                      <span className="fw-bold text-white d-block" style={{ fontSize: '14px' }}>Manage Stock</span>
                    </div>
                  </Link>
                </div>
              </>
            )}

            {isSalesPerson && (
              <>
                <div className="col-md-3 col-sm-6">
                  <Link to="/admin/add-order" className="text-decoration-none">
                    <div className="glass-card text-center p-3 h-100 hover-elevate" style={{ border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.05)' }}>
                      <PlusCircle size={28} className="text-primary mb-2 mx-auto d-block" />
                      <span className="fw-bold text-white d-block" style={{ fontSize: '14px' }}>Create In-Store Order</span>
                    </div>
                  </Link>
                </div>
                <div className="col-md-3 col-sm-6">
                  <Link to="/admin/orders" className="text-decoration-none">
                    <div className="glass-card text-center p-3 h-100 hover-elevate" style={{ border: '1px solid rgba(129, 140, 248, 0.3)', background: 'rgba(129, 140, 248, 0.05)' }}>
                      <ShoppingCart size={28} style={{ color: '#818cf8' }} className="mb-2 mx-auto d-block" />
                      <span className="fw-bold text-white d-block" style={{ fontSize: '14px' }}>View Orders</span>
                    </div>
                  </Link>
                </div>
                <div className="col-md-3 col-sm-6">
                  <Link to="/admin/users" className="text-decoration-none">
                    <div className="glass-card text-center p-3 h-100 hover-elevate" style={{ border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.05)' }}>
                      <Users size={28} className="text-primary mb-2 mx-auto d-block" />
                      <span className="fw-bold text-white d-block" style={{ fontSize: '14px' }}>Manage Customers</span>
                    </div>
                  </Link>
                </div>
                <div className="col-md-3 col-sm-6">
                  <Link to="/admin/reports" className="text-decoration-none">
                    <div className="glass-card text-center p-3 h-100 hover-elevate" style={{ border: '1px solid rgba(74, 222, 128, 0.3)', background: 'rgba(74, 222, 128, 0.05)' }}>
                      <DollarSign size={28} style={{ color: '#4ade80' }} className="mb-2 mx-auto d-block" />
                      <span className="fw-bold text-white d-block" style={{ fontSize: '14px' }}>Sales Reports</span>
                    </div>
                  </Link>
                </div>
              </>
            )}

            {isTechnician && (
              <>
                <div className="col-md-4 col-sm-6">
                  <Link to="/admin/repairs" className="text-decoration-none">
                    <div className="glass-card text-center p-3 h-100 hover-elevate" style={{ border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.05)' }}>
                      <Wrench size={28} className="text-primary mb-2 mx-auto d-block" />
                      <span className="fw-bold text-white d-block" style={{ fontSize: '14px' }}>My Repair Jobs</span>
                    </div>
                  </Link>
                </div>
                <div className="col-md-4 col-sm-6">
                  <Link to="/admin/repairs?filter=pending" className="text-decoration-none">
                    <div className="glass-card text-center p-3 h-100 hover-elevate" style={{ border: '1px solid rgba(251, 191, 36, 0.3)', background: 'rgba(251, 191, 36, 0.05)' }}>
                      <Clock size={28} style={{ color: '#fbbf24' }} className="mb-2 mx-auto d-block" />
                      <span className="fw-bold text-white d-block" style={{ fontSize: '14px' }}>Pending Jobs</span>
                    </div>
                  </Link>
                </div>
                <div className="col-md-4 col-sm-6">
                  <Link to="/admin/repairs?filter=completed" className="text-decoration-none">
                    <div className="glass-card text-center p-3 h-100 hover-elevate" style={{ border: '1px solid rgba(74, 222, 128, 0.3)', background: 'rgba(74, 222, 128, 0.05)' }}>
                      <CheckCircle2 size={28} style={{ color: '#4ade80' }} className="mb-2 mx-auto d-block" />
                      <span className="fw-bold text-white d-block" style={{ fontSize: '14px' }}>Completed Jobs</span>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
