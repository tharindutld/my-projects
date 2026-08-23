import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, User, ShoppingBag, Eye, Calendar, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, token, loading: authLoading, updateProfile, API_URL } = useAuth();
  const navigate = useNavigate();

  // Edit Profile States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  
  // States
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate('/login');
      return;
    }

    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setMobileNumber(user.mobileNumber || '');
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [token, user, authLoading]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!firstName || !lastName || !mobileNumber) {
      setError('Please fill in all profile fields.');
      return;
    }

    if (!/^0[0-9]{9}$/.test(mobileNumber)) {
      setError('Mobile number must be exactly 10 digits starting with 0.');
      return;
    }

    try {
      const msg = await updateProfile({ firstname: firstName, lastname: lastName, mobilenumber: mobileNumber });
      setSuccess(msg);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '30px' }}>My Account</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        alignItems: 'flex-start'
      }}>
        
        {/* Left Side: Profile Specs & Edit form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Points Card */}
          <div className="glass-panel" style={{
            padding: '30px',
            background: 'radial-gradient(circle at top left, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.5))',
            borderLeft: '4px solid var(--warning)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award className="text-warning" /> Loyalty Rewards Points
            </h3>
            <div style={{ fontSize: '48px', fontWeight: '800', margin: '15px 0' }}>
              {user?.loyaltyPoints || 0} <span style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: '500' }}>Points</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Earn 1 point for every Rs. 1000 spent. Redeem points at checkout for direct discounts on your order (1 point = Rs. 1.00 discount).
            </p>
          </div>

          {/* Edit Profile Form */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Settings size={20} className="text-primary" /> Update Account Details
            </h2>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>First Name</label>
                  <input type="text" className="glass-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Last Name</label>
                  <input type="text" className="glass-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Mobile Phone</label>
                <input type="text" className="glass-input" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Email Address (read-only)</label>
                <input type="email" className="glass-input" value={user?.email || ''} readOnly style={{ opacity: 0.6 }} />
              </div>

              {error && <div style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</div>}
              {success && <div style={{ color: 'var(--success)', fontSize: '13px' }}>{success}</div>}

              <button type="submit" className="glass-btn" style={{ borderRadius: '8px', marginTop: '10px' }}>
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Order history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingBag size={20} className="text-secondary" /> Purchase History
            </h2>

            {loadingOrders ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading purchase list...</div>
            ) : orders.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>You haven't placed any orders yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {orders.map(order => (
                  <div key={order.ID} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                      <strong style={{ fontSize: '14px', display: 'block' }}>Order #{order.OrderNumber}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                        Placed: {new Date(order.OrderDate).toLocaleDateString()} &bull; {order.TotalItems} item(s)
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Status: <span style={{
                          color: order.OrderStatus === 'Completed' ? 'var(--success)' : order.OrderStatus === 'Cancelled' ? 'var(--danger)' : 'var(--warning)',
                          fontWeight: '700'
                        }}>{order.OrderStatus}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <strong style={{ fontSize: '15px' }}>Rs. {parseFloat(order.TotalAmount).toLocaleString('en-US')}</strong>
                      <button onClick={() => handleViewOrderDetails(order.ID)} className="glass-btn glass-btn-secondary" style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
                        <Eye size={14} /> Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Selected Order Modal-like popup */}
          {selectedOrder && (
            <div className="glass-panel animate-fade-in" style={{ padding: '30px', border: '1px solid var(--primary-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Order Details: #{selectedOrder.OrderNumber}</h3>
                <div>
                  <button onClick={() => navigate(`/invoice/${selectedOrder.ID}`)} className="glass-btn" style={{ padding: '4px 10px', fontSize: '12px', marginRight: '8px' }}>Invoice</button>
                  <button onClick={() => setSelectedOrder(null)} className="glass-btn glass-btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Close</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '13px' }}>
                <div>
                  <strong>Order Date:</strong> {new Date(selectedOrder.OrderDate).toLocaleString()}<br />
                  <strong>Delivery Status:</strong> <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{selectedOrder.DeliveryStatus}</span><br />
                  <strong>Payment Method:</strong> {selectedOrder.PaymentMethod}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Items Purchased:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.ProductName} ({item.Color}, {item.ROM}/{item.RAM} RAM) x{item.ProductQty}</span>
                        <strong>Rs. {(parseFloat(item.ProductPrice) * item.ProductQty).toLocaleString('en-US')}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                  <span>Total Amount Paid</span>
                  <span>Rs. {parseFloat(selectedOrder.TotalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
