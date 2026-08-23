import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, Package, Star, MapPin, Calendar, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import AdminLayout from '../components/AdminLayout';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function AdminReports() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!token || !user || user.role === 'Customer') {
      navigate('/login?staff=true');
      return;
    }
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/reports/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          if (data.monthlySales && data.monthlySales.length > 0) {
            setChartData({
              labels: data.monthlySales.map(m => m.month_label),
              datasets: [{
                label: 'Monthly Revenue (LKR)',
                data: data.monthlySales.map(m => parseFloat(m.rev)),
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                fill: true,
                tension: 0.35,
                borderWidth: 3,
                pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                pointRadius: 5
              }]
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, user, authLoading]);

  const reportCards = [
    {
      title: 'Daily Sales',
      desc: 'Sales volume, quantity sold, payment modes, and profit breakdown.',
      icon: <TrendingUp size={24} />,
      iconBg: 'rgba(99,102,241,0.15)',
      iconColor: 'var(--primary)',
      stat: stats ? `Rs. ${parseFloat(stats.todaySales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—',
      statLabel: "Today's Sales",
      href: null,
      adminOnly: false
    },
    {
      title: 'Inventory Aging',
      desc: 'Track days unsold, slow-moving stock, and critical dead-stock inventory.',
      icon: <Package size={24} />,
      iconBg: 'rgba(239,68,68,0.15)',
      iconColor: 'var(--danger)',
      stat: stats ? `${stats.totalStock} units` : '—',
      statLabel: 'Total Units in Stock',
      href: '/admin/inventory',
      adminOnly: true
    },
    {
      title: 'Customer Behavior',
      desc: 'Leaderboards, average client spending, and brand preferences.',
      icon: <Users size={24} />,
      iconBg: 'rgba(6,182,212,0.15)',
      iconColor: 'var(--secondary)',
      stat: stats ? `${stats.totalCustomers} accounts` : '—',
      statLabel: 'Total Members',
      href: '/admin/users',
      adminOnly: false
    },
    {
      title: 'Brand Performance',
      desc: 'Units sold, revenue, net profit, and warranty claim rates by brand.',
      icon: <Star size={24} />,
      iconBg: 'rgba(245,158,11,0.15)',
      iconColor: '#f59e0b',
      stat: stats?.bestBrand || 'N/A',
      statLabel: 'Top Brand',
      href: null,
      adminOnly: true
    },
    {
      title: 'Staff Performance',
      desc: 'Sales handled, repairs completed, and average client ratings.',
      icon: <ShieldCheck size={24} />,
      iconBg: 'rgba(156,163,175,0.15)',
      iconColor: 'var(--text-muted)',
      stat: stats ? `${stats.totalStaff} employees` : '—',
      statLabel: 'Active Staff',
      href: null,
      adminOnly: true
    },
    {
      title: 'Seasonal Trends',
      desc: 'Weekly & monthly revenue spikes, peak cycles, and slow periods.',
      icon: <Calendar size={24} />,
      iconBg: 'rgba(99,102,241,0.1)',
      iconColor: '#818cf8',
      stat: stats ? `Rs. ${parseFloat(stats.monthSales || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}` : '—',
      statLabel: 'Month Sales',
      href: null,
      adminOnly: false
    },
    {
      title: 'Geographic Areas',
      desc: 'Order locations, sales distribution by cities, and regional demand.',
      icon: <MapPin size={24} />,
      iconBg: 'rgba(255,255,255,0.05)',
      iconColor: 'var(--text-muted)',
      stat: stats?.topLocation || 'N/A',
      statLabel: 'High Demand Area',
      href: null,
      adminOnly: false
    }
  ];

  const visibleCards = user?.role === 'Admin' ? reportCards : reportCards.filter(c => !c.adminOnly);

  return (
    <AdminLayout>
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>

      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart2 size={28} style={{ color: 'var(--primary)' }} /> Executive Decision Reports
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          View live data analytics, performance statistics, and business intelligence.
        </p>
      </div>

      {/* Monthly Chart */}
      {chartData && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} /> Executive Sales Revenue Performance (Monthly Summary)
            </h3>
            <span style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600' }}>
              Live Database Sync
            </span>
          </div>
          <div style={{ height: '240px' }}>
            <Line data={chartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', labels: { color: 'rgba(255,255,255,0.7)' } }
              },
              scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } }
              }
            }} />
          </div>
        </div>
      )}

      {/* Report Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading report data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
          {visibleCards.map((card, i) => (
            <div key={i} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ background: card.iconBg, color: card.iconColor, padding: '12px', borderRadius: '12px' }}>
                  {card.icon}
                </div>
              </div>
              <h4 style={{ fontWeight: '700', fontSize: '16px' }}>{card.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', flexGrow: 1 }}>{card.desc}</p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{card.statLabel}</span>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: card.iconColor }}>{card.stat}</span>
                </div>
                {card.href ? (
                  <button onClick={() => navigate(card.href)} className="glass-btn" style={{ width: '100%', borderRadius: '8px', fontSize: '13px' }}>
                    View Details →
                  </button>
                ) : (
                  <div className="glass-btn glass-btn-secondary" style={{ width: '100%', borderRadius: '8px', fontSize: '13px', textAlign: 'center', padding: '10px 0', opacity: 0.5, cursor: 'default' }}>
                    Coming Soon
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
