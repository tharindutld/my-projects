import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, Receipt, Award, ArrowLeft, 
  FileText, CheckCircle, Clock 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ToastAlert from '../components/ToastAlert';
import './UserOrders.css';

export default function UserOrders() {
  const { uid: paramUid } = useParams();
  const [searchParams] = useSearchParams();
  const queryUid = searchParams.get('uid');
  const uid = paramUid || queryUid;

  const { token, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ totalOrders: 0, totalSpend: 0, loyaltyPoints: 0 });
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUserOrders = async () => {
    if (!uid) {
      navigate('/admin/users');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/admin/user-history/${uid}?page=${currentPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        setStats(data.stats);
        setOrders(data.orders);
        setPagination(data.pagination);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to load customer order history.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error loading customer data.');
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
    fetchUserOrders();
  }, [token, uid, currentPage, authLoading]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-4 text-center text-light">
          <div className="spinner-border text-primary me-2" role="status"></div>
          Loading Customer Purchase History...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="user-orders-container">
        <ToastAlert message={error} type="danger" onClose={() => setError('')} />

        {/* Header Bar */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--primary)',
              background: 'rgba(99,102,241,0.12)',
              padding: '4px 10px',
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '10px'
            }}>Customer Ledger</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }} className="text-white d-flex align-items-center gap-2">
              <Receipt className="text-primary" /> Customer Purchase History
            </h1>
            <p className="text-muted small mt-1 mb-0">
              Review completed orders, net spend metrics, and invoices for {userData ? `${userData.FirstName} ${userData.LastName}` : 'Customer'}.
            </p>
          </div>
          <button 
            className="btn btn-outline-light btn-sm rounded-pill d-flex align-items-center gap-2 px-3"
            onClick={() => navigate('/admin/users')}
          >
            <ArrowLeft size={16} /> Back to Customers
          </button>
        </div>

        {/* Customer Profile Banner Card */}
        {userData && (
          <div className="glass-card mb-4 p-4">
            <div className="row align-items-center">
              <div className="col-md-6 border-end border-secondary pe-md-4">
                <h5 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                  <User className="text-primary" /> {userData.FirstName} {userData.LastName}
                </h5>
                <div className="small text-muted mb-1">
                  <strong className="text-light">Email Address:</strong> {userData.Email}
                </div>
                <div className="small text-muted mb-1">
                  <strong className="text-light">Mobile Phone:</strong> {userData.MobileNumber || 'N/A'}
                </div>
                <div className="small text-muted">
                  <strong className="text-light">Registered On:</strong> {new Date(userData.RegDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div className="col-md-6 ps-md-4 mt-3 mt-md-0">
                <div className="row text-center">
                  <div className="col-4 border-end border-secondary">
                    <div className="text-muted small mb-1">Total Orders</div>
                    <h3 className="fw-bold text-white mb-0">{stats.totalOrders}</h3>
                  </div>
                  <div className="col-4 border-end border-secondary">
                    <div className="text-muted small mb-1">Loyalty Points</div>
                    <h3 className="fw-bold text-warning mb-0 d-flex align-items-center justify-content-center gap-1">
                      <Award size={22} /> {stats.loyaltyPoints}
                    </h3>
                  </div>
                  <div className="col-4">
                    <div className="text-muted small mb-1">Total Spent</div>
                    <h4 className="fw-bold text-success mb-0">
                      Rs. {parseFloat(stats.totalSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Ledger Table */}
        <div className="glass-card p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
              <Receipt className="text-secondary" /> Order Ledger
            </h5>
          </div>

          <div className="table-responsive">
            <table className="table table-dark align-middle mb-0">
              <thead>
                <tr className="text-muted border-secondary">
                  <th className="ps-3">S.NO</th>
                  <th>Order Number</th>
                  <th>Total Amount</th>
                  <th>Payment Method</th>
                  <th>Order Date</th>
                  <th>Status</th>
                  <th className="text-center">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No order history found for this customer.
                    </td>
                  </tr>
                ) : (
                  orders.map((row, index) => {
                    const cnt = (currentPage - 1) * 10 + index + 1;
                    const status = row.OrderStatus;
                    const badgeClass = status === 'Completed' ? 'bg-success' : (status === 'Cancelled' ? 'bg-danger' : 'bg-warning text-dark');

                    return (
                      <tr key={row.ID} className="border-secondary">
                        <td className="ps-3 text-muted">{cnt}</td>
                        <td className="fw-bold text-white">{row.OrderNumber}</td>
                        <td className="fw-bold text-primary">
                          Rs. {parseFloat(row.TotalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span className="badge bg-dark border border-secondary text-light">
                            {row.PaymentMethod}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {new Date(row.OrderDate).toLocaleString(undefined, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`}>
                            {status}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 d-inline-flex align-items-center gap-1"
                            onClick={() => window.open(`/invoice/${row.ID}?isAdmin=1`, '_blank')}
                          >
                            <FileText size={14} /> View Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav>
                <ul className="pagination pagination-dark gap-1 mb-0">
                  <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>&laquo;</button>
                  </li>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                    <li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(p)}>{p}</button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage >= pagination.totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}>&raquo;</button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
