import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, X, ShieldAlert, Package, Eye, Trash2, ShoppingBag, Plus, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';
import ToastAlert from '../components/ToastAlert';
import { formatCurrency } from '../utils/format';
import './AdminOrders.css';

export default function AdminOrders() {
  const { token, loading: authLoading, API_URL } = useAuth();
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
    if (authLoading) return;

    if (!token) {
      navigate('/login?staff=true');
      return;
    }
    fetchOrders();
  }, [token, currentPage, filterStatus, authLoading]);

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

  const handleUpdateDeliveryStatus = (orderId, newDelivery) => {
    setConfirmModal({
      isOpen: true,
      title: 'Update Delivery Status',
      message: `Are you sure you want to set delivery status to: ${newDelivery}?`,
      variant: 'warning',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
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
      }
    });
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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
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
          }}>Order Management</span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={28} className="text-primary" /> Customer Orders Management
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/admin/add-order" className="glass-btn" style={{ borderRadius: '12px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
            <Plus size={16} /> Create Order (POS)
          </Link>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="custom-glass-input" style={{ width: '200px' }}>
            <option value="">All Order Statuses</option>
            <option value="Order Placed">Order Placed</option>
            <option value="Packed">Packed</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
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
              {orders.map(ord => {
                const statusClass = 
                  ord.OrderStatus === 'Delivered' ? 'status-pill-delivered' :
                  ord.OrderStatus === 'Cancelled' ? 'status-pill-cancelled' :
                  ord.OrderStatus === 'Dispatched' ? 'status-pill-dispatched' : 'status-pill-pending';

                const customerName = ord.BillingName || (ord.FirstName ? `${ord.FirstName} ${ord.LastName || ''}`.trim() : (ord.ShippingName || 'Walk-in / Online Customer'));
                const amount = ord.TotalAmount ?? ord.GrandTotal ?? 0;

                return (
                  <div key={ord.ID} className="orders-card-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#fff' }}>Order #{ord.OrderNumber}</strong>
                      <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Customer: <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{customerName}</span> &bull; Date: {new Date(ord.OrderDate).toLocaleDateString()}
                      </span>
                      <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Total Amount: <strong style={{ color: '#818cf8' }}>Rs. {formatCurrency(amount)}</strong>
                      </span>
                      <div style={{ marginTop: '10px' }}>
                        <span className={`status-pill ${statusClass}`}>
                          Status: {ord.OrderStatus}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setSelectedOrder(ord)} className="glass-btn glass-btn-secondary" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px' }}>
                        <Eye size={14} /> View Details
                      </button>
                    </div>
                  </div>
                );
              })}

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
          <div className="orders-panel-detail animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Order #{selectedOrder.OrderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="glass-btn glass-btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Shipping Address & Recipient</strong>
                <div style={{ color: '#fff', fontWeight: '600' }}>
                  {selectedOrder.BillingName || selectedOrder.ShippingName || (selectedOrder.FirstName ? `${selectedOrder.FirstName} ${selectedOrder.LastName || ''}`.trim() : 'Customer')}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {selectedOrder.BillingAddress || selectedOrder.ShippingAddress || 'N/A'}{selectedOrder.BillingCity ? `, ${selectedOrder.BillingCity}` : ''}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Phone: {selectedOrder.BillingPhone || selectedOrder.ShippingPhone || selectedOrder.MobileNumber || 'N/A'} | Email: {selectedOrder.BillingEmail || selectedOrder.Email || 'N/A'}
                </div>
              </div>

              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Payment Info</strong>
                <div style={{ color: '#e2e8f0' }}>Method: {selectedOrder.PaymentMethod || 'Card'}</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#818cf8', marginTop: '4px' }}>
                  Grand Total: Rs. {formatCurrency(selectedOrder.TotalAmount ?? selectedOrder.GrandTotal ?? 0)}
                </div>
              </div>

              {/* Items Breakdown */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '10px' }}>
                    Purchased Products ({selectedOrder.items.length})
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="glass-card" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '13px', color: '#fff', display: 'block' }}>{item.ProductName}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {item.Color} &bull; {item.RAM}/{item.ROM} &bull; Qty: {item.ProductQty}
                          </span>
                        </div>
                        <span style={{ color: '#818cf8', fontWeight: '700', fontSize: '13px' }}>
                          Rs. {formatCurrency(parseFloat(item.ProductPrice || 0) * (item.ProductQty || 1))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View Invoice Button */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <button
                  onClick={() => window.open(`/invoice/${selectedOrder.ID}?isAdmin=1`, '_blank')}
                  className="glass-btn glass-btn-secondary"
                  style={{ width: '100%', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <FileText size={15} /> View Full Invoice / Receipt
                </button>
              </div>

              {/* Order Status Controls */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#f8fafc' }}>Update Order Processing Status</label>
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
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#f8fafc' }}>Delivery Tracking Status</label>
                <select
                  className="custom-glass-input w-100"
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
