import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, ShieldAlert, Package, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminOrders() {
  const { token, API_URL } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to set order status to: ${newStatus}?`)) return;
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
        alert(data.message);
        fetchOrders();
        if (selectedOrder?.ID === orderId) {
          setSelectedOrder(prev => ({ ...prev, OrderStatus: newStatus }));
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDeliveryStatus = async (orderId, newDelivery) => {
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
        alert(data.message);
        fetchOrders();
        if (selectedOrder?.ID === orderId) {
          setSelectedOrder(prev => ({ ...prev, DeliveryStatus: newDelivery }));
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this order?')) return;
    try {
      const res = await fetch(`${API_URL}/orders/admin/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <button onClick={() => navigate('/admin')} className="glass-btn glass-btn-secondary" style={{ borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Manage Orders</h1>
        </div>

        {/* Filter Tab */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="glass-input">
            <option value="">All Orders</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedOrder ? '1fr 1fr' : '1fr',
        gap: '30px',
        alignItems: 'flex-start'
      }}>
        {/* Orders Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Fetching orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No orders found matching search criteria.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {orders.map(order => (
                <div key={order.ID} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '15px' }}>#{order.OrderNumber}</strong>
                    <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Client: {order.FirstName} {order.LastName} &bull; {new Date(order.OrderDate).toLocaleDateString()}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <span style={{
                        background: order.OrderStatus === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : order.OrderStatus === 'Cancelled' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: order.OrderStatus === 'Completed' ? 'var(--success)' : order.OrderStatus === 'Cancelled' ? 'var(--danger)' : 'var(--warning)',
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700'
                      }}>{order.OrderStatus}</span>
                      <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        {order.DeliveryStatus}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong style={{ fontSize: '16px' }}>Rs. {parseFloat(order.TotalAmount).toLocaleString('en-US')}</strong>
                    <button onClick={() => setSelectedOrder(order)} className="glass-btn glass-btn-secondary" style={{ padding: '8px 12px', borderRadius: '8px' }}>
                      <Eye size={14} /> Details
                    </button>
                  </div>
                </div>
              ))}

              {/* Pagination controls */}
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

        {/* Selected Order Details & Management Pane */}
        {selectedOrder && (
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Manage Order #{selectedOrder.OrderNumber}</h2>
              <div>
                <button onClick={() => navigate(`/invoice/${selectedOrder.ID}?isAdmin=1`)} className="glass-btn" style={{ padding: '4px 10px', fontSize: '12px', marginRight: '8px' }}>Invoice</button>
                <button onClick={() => setSelectedOrder(null)} className="glass-btn glass-btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Close</button>
              </div>
            </div>

            {/* Quick Action status updates */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleUpdateOrderStatus(selectedOrder.ID, 'Completed')} disabled={selectedOrder.OrderStatus === 'Completed'} className="glass-btn" style={{ background: 'var(--success)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', flexGrow: 1 }}>
                Mark Completed
              </button>
              <button onClick={() => handleUpdateOrderStatus(selectedOrder.ID, 'Cancelled')} disabled={selectedOrder.OrderStatus === 'Cancelled'} className="glass-btn glass-btn-danger" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '12px', flexGrow: 1 }}>
                Cancel Order
              </button>
            </div>

            {/* Delivery state selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Update Delivery Status:</label>
              <select
                value={selectedOrder.DeliveryStatus}
                onChange={(e) => handleUpdateDeliveryStatus(selectedOrder.ID, e.target.value)}
                className="glass-input"
              >
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Returned">Returned</option>
              </select>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

            {/* Order Items Table */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Line Items:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', background: 'rgba(0,0,0,0.1)', padding: '15px', borderRadius: '8px' }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.ProductName} ({item.Color}, {item.ROM}/{item.RAM}) x{item.ProductQty}</span>
                    <strong>Rs. {(parseFloat(item.ProductPrice) * item.ProductQty).toLocaleString('en-US')}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Info details */}
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <strong>Recipient:</strong> {selectedOrder.ShippingName} ({selectedOrder.ShippingPhone})<br />
              <strong>Address:</strong> {selectedOrder.ShippingAddress}, {selectedOrder.ShippingPostalCode}, {selectedOrder.ShippingCountry}<br />
              <strong>Transaction Details:</strong> {selectedOrder.TransactionDetails || 'None'}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

            <button onClick={() => handleDeleteOrder(selectedOrder.ID)} className="glass-btn glass-btn-danger" style={{ width: '100%', borderRadius: '8px', fontSize: '12px' }}>
              Permanently Delete Order Record
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
