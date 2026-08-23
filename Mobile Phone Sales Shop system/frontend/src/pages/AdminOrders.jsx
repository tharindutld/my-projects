import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, ShieldAlert, Package, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';
import ToastAlert from '../components/ToastAlert';

export default function AdminOrders() {
  const { token, API_URL } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Error/Success Notification
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/orders/admin/list`);
      url.searchParams.append('page', currentPage);
      if (filterStatus) {
        url.searchParams.append('status', filterStatus);
      }

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login?staff=true');
      return;
    }
    fetchOrders();
  }, [token, currentPage, filterStatus]);

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setConfirmModal({
      isOpen: true,
      title: 'Update Order Status',
      message: `Are you sure you want to set order status to: ${newStatus}?`,
      variant: newStatus === 'Cancelled' ? 'danger' : 'primary',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/orders/admin/${orderId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
          });
          const data = await res.json();
          if (res.ok) {
            setSuccess(data.message);
            fetchOrders();
            if (selectedOrder?.ID === orderId) {
              setSelectedOrder(prev => ({ ...prev, OrderStatus: newStatus }));
            }
          } else {
            setError(data.message);
          }
        } catch (err) {
          setError('Failed to update order status.');
        }
      }
    });
  };

  const handleUpdateDeliveryStatus = async (orderId, newDelivery) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/orders/admin/${orderId}/delivery`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ delivery: newDelivery })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        fetchOrders();
        if (selectedOrder?.ID === orderId) {
          setSelectedOrder(prev => ({ ...prev, DeliveryStatus: newDelivery }));
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update delivery status.');
    }
  };

  const handleDeleteOrder = (orderId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Order Record',
      message: 'WARNING: Are you sure you want to permanently delete this customer order?',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/orders/admin/${orderId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setSuccess(data.message);
            setSelectedOrder(null);
            fetchOrders();
          } else {
            setError(data.message);
          }
        } catch (err) {
          setError('Error deleting order record.');
        }
      }
    });
  };

  return (
    <AdminLayout>
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {error && <ToastAlert type="error" message={error} onClose={() => setError('')} />}
      {success && <ToastAlert type="success" message={success} onClose={() => setSuccess('')} />}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant || 'danger'}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <button onClick={() => navigate('/admin')} className="glass-btn glass-btn-secondary" style={{ borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Customer Orders Management</h1>
        </div>

        {/* Filter status */}
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="glass-input" style={{ width: '200px' }}>
          <option value="">All Order Statuses</option>
          <option value="Order Placed">Order Placed</option>
          <option value="Packed">Packed</option>
          <option value="Dispatched">Dispatched</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedOrder ? '1.2fr 1fr' : '1fr',
        gap: '30px',
        alignItems: 'flex-start'
      }}>
        {/* Orders Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Fetching orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No customer orders found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {orders.map(ord => (
                <div key={ord.ID} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <strong style={{ fontSize: '15px' }}>Order #{ord.OrderNumber}</strong>
                    <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Customer: {ord.BillingFirstName} {ord.BillingLastName} &bull; Date: {new Date(ord.OrderDate).toLocaleDateString()}
                    </span>
                    <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)' }}>
                      Total Amount: <strong style={{ color: 'var(--primary)' }}>Rs. {parseFloat(ord.GrandTotal).toLocaleString()}</strong>
                    </span>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <span style={{
                        background: ord.OrderStatus === 'Delivered' ? 'rgba(16, 185, 129, 0.15)' : ord.OrderStatus === 'Cancelled' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: ord.OrderStatus === 'Delivered' ? 'var(--success)' : ord.OrderStatus === 'Cancelled' ? 'var(--danger)' : 'var(--warning)',
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700'
                      }}>Status: {ord.OrderStatus}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setSelectedOrder(ord)} className="glass-btn glass-btn-secondary" style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}>
                      <Eye size={14} /> View Details
                    </button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="glass-btn glass-btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  Prev
                </button>
                <span style={{ alignSelf: 'center', fontSize: '13px' }}>Page {currentPage} of {pagination.totalPages}</span>
                <button
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  className="glass-btn glass-btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Order Detail Sidebar Panel */}
        {selectedOrder && (
          <div className="glass-panel animate-fade-in" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Order #{selectedOrder.OrderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="glass-btn glass-btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Shipping Address & Recipient</strong>
                <div>{selectedOrder.BillingFirstName} {selectedOrder.BillingLastName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{selectedOrder.BillingAddress}, {selectedOrder.BillingCity}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Phone: {selectedOrder.BillingPhone} | Email: {selectedOrder.BillingEmail}</div>
              </div>

              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Payment Info</strong>
                <div>Method: {selectedOrder.PaymentMethod} ({selectedOrder.PaymentStatus})</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
                  Grand Total: Rs. {parseFloat(selectedOrder.GrandTotal).toLocaleString()}
                </div>
              </div>

              {/* Order Status Controls */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Update Order Processing Status</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Order Placed', 'Packed', 'Dispatched', 'Delivered', 'Cancelled'].map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateOrderStatus(selectedOrder.ID, st)}
                      className={`glass-btn ${selectedOrder.OrderStatus === st ? 'glass-btn-primary' : 'glass-btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Tracking status */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Delivery Tracking Status</label>
                <select
                  className="glass-input"
                  value={selectedOrder.DeliveryStatus || 'Pending'}
                  onChange={(e) => handleUpdateDeliveryStatus(selectedOrder.ID, e.target.value)}
                >
                  <option value="Pending">Pending Dispatch</option>
                  <option value="In-Transit">In-Transit / Courier Pickup</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered Successfully</option>
                </select>
              </div>

              {/* Delete Order */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '10px' }}>
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.ID)}
                  className="glass-btn glass-btn-danger"
                  style={{ width: '100%', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} /> Permanently Delete Order Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
    </AdminLayout>
  );
}
