import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, ShoppingBag, History, Search, XCircle, 
  FileText, Printer, Star, Truck, Receipt, 
  Home, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ToastAlert from '../components/ToastAlert';
import './MyOrders.css';

export default function MyOrders() {
  const { user, token, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'current';
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ratings, setRatings] = useState({}); // orderId -> rating

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        const ratingMap = {};
        data.forEach(o => {
          if (o.OrderRating) ratingMap[o.ID] = parseInt(o.OrderRating);
        });
        setRatings(ratingMap);
      } else {
        setError('Failed to fetch your orders.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error fetching orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      navigate('/login');
      return;
    }
    fetchMyOrders();
  }, [token, authLoading]);

  const handleRateOrder = async (orderId, ratingValue) => {
    try {
      const res = await fetch(`${API_URL}/orders/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_id: orderId, rating: ratingValue })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRatings(prev => ({ ...prev, [orderId]: ratingValue }));
        setSuccess('Thank you for rating your order!');
      } else {
        setError(data.message || 'Failed to submit rating.');
      }
    } catch (err) {
      console.error(err);
      setError('Error submitting rating.');
    }
  };

  // Filter orders based on active tab and search
  const filteredOrders = orders.filter(order => {
    const isCompletedOrCancelled = ['Completed', 'Cancelled'].includes(order.OrderStatus);
    if (activeTab === 'current') {
      return !isCompletedOrCancelled;
    } else {
      if (!isCompletedOrCancelled) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchNum = order.OrderNumber?.toLowerCase().includes(q);
      const matchDetails = order.TransactionDetails?.toLowerCase().includes(q);
      return matchNum || matchDetails;
    }
  });

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary me-2" role="status"></div>
        Loading your orders...
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <ToastAlert message={error} type="danger" onClose={() => setError('')} />
      <ToastAlert message={success} type="success" onClose={() => setSuccess('')} />

      {/* Page Title Banner */}
      <div className="my-orders-banner py-4 mb-4">
        <div className="container">
          <h2 className="fw-bold text-white mb-0 d-flex align-items-center gap-3">
            <Package size={32} /> My Orders
          </h2>
        </div>
      </div>

      <div className="container mb-5">
        {/* Navigation Tabs */}
        <div className="d-flex justify-content-center mb-4">
          <div className="nav nav-pills custom-pill-tabs p-1 bg-white rounded-pill shadow-sm border">
            <button
              className={`nav-link rounded-pill py-2 px-4 fw-semibold ${activeTab === 'current' ? 'active bg-primary text-white' : 'text-secondary'}`}
              onClick={() => setSearchParams({ tab: 'current' })}
            >
              <ShoppingBag className="me-2" /> Current Orders
            </button>
            <button
              className={`nav-link rounded-pill py-2 px-4 fw-semibold ${activeTab === 'history' ? 'active bg-primary text-white' : 'text-secondary'}`}
              onClick={() => setSearchParams({ tab: 'history' })}
            >
              <History className="me-2" /> Order History
            </button>
          </div>
        </div>

        {/* History Search Bar */}
        {activeTab === 'history' && (
          <div className="card shadow-sm border-0 mb-4 rounded-4 bg-white p-3 search-card">
            <div className="row g-2 align-items-center">
              <div className="col-md-9">
                <div className="input-group">
                  <span className="input-group-text bg-light border-0 text-muted"><Search /></span>
                  <input
                    type="text"
                    className="form-control bg-light border-0"
                    placeholder="Search past orders by order number or details..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3 d-flex gap-2">
                <button 
                  className="btn btn-primary w-100 py-2 rounded-pill"
                  onClick={() => setSearchParams({ tab: 'history', search: searchQuery })}
                >
                  Filter
                </button>
                {searchQuery && (
                  <button 
                    className="btn btn-outline-secondary py-2 rounded-pill"
                    onClick={() => { setSearchQuery(''); setSearchParams({ tab: 'history' }); }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders List / Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
            <div className="py-4">
              <Receipt size={64} className="text-muted mb-3 d-block mx-auto" />
              {activeTab === 'current' ? (
                <>
                  <h4 className="fw-bold text-dark">No Current Orders</h4>
                  <p className="text-muted">You do not have any active or processing orders at the moment.</p>
                  <button className="btn btn-primary rounded-pill px-4 mt-2" onClick={() => navigate('/products')}>
                    Start Shopping
                  </button>
                </>
              ) : (
                <>
                  <h4 className="fw-bold text-dark">No Order History</h4>
                  <p className="text-muted">
                    {searchQuery ? `No past orders found matching '${searchQuery}'.` : 'You have no past completed or cancelled orders.'}
                  </p>
                  <button className="btn btn-primary rounded-pill px-4 mt-2" onClick={() => navigate('/products')}>
                    Start Shopping
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-12">
              {filteredOrders.map((order) => {
                const status = order.OrderStatus;
                const delStatus = order.DeliveryStatus || 'Processing';
                const currentRating = ratings[order.ID] || 0;

                // Stepper states
                let step1 = 'completed';
                let step2 = '';
                let step3 = '';
                let step4 = '';
                let fillWidth = '0%';

                if (delStatus === 'Processing') {
                  step2 = 'pending';
                  fillWidth = '16%';
                } else if (delStatus === 'Shipped' || delStatus === 'In Transit') {
                  step2 = 'completed';
                  step3 = 'pending';
                  fillWidth = '50%';
                } else if (delStatus === 'Delivered') {
                  step2 = 'completed';
                  step3 = 'completed';
                  step4 = 'completed';
                  fillWidth = '100%';
                }

                return (
                  <div key={order.ID} className="card order-card mb-4 border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                    {/* Header */}
                    <div className="card-header bg-light border-bottom py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <span className="text-muted small text-uppercase d-block">Order Number</span>
                        <h6 className="fw-bold text-dark mb-0">{order.OrderNumber}</h6>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div>
                          <span className="text-muted small text-uppercase d-block text-end">Date</span>
                          <span className="fw-semibold text-dark small">
                            {new Date(order.OrderDate).toLocaleString(undefined, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="border-start" style={{ height: '24px' }}></span>
                        <div>
                          <span className="text-muted small text-uppercase d-block text-end">Total Amount</span>
                          <span className="fw-bold text-primary">
                            Rs. {parseFloat(order.TotalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="card-body p-4">
                      <div className="row g-4 align-items-center">
                        
                        {/* Order Summary & Status */}
                        <div className="col-md-6 border-end pe-md-4">
                          <h6 className="fw-bold text-secondary mb-2">Order Information</h6>
                          <div className="small text-muted mb-2">
                            <strong>Payment Method:</strong> <span className="badge bg-light text-dark border ms-1">{order.PaymentMethod}</span>
                          </div>
                          {order.TransactionDetails && (
                            <div className="small text-muted mb-3">
                              <strong>Details:</strong> {order.TransactionDetails}
                            </div>
                          )}

                          <div className="row g-2 mt-2 pt-2 border-top">
                            <div className="col-6">
                              <strong className="text-dark small d-block mb-1"><Truck className="me-1" /> Shipping:</strong>
                              <span className="d-block text-dark small">{order.ShippingName}</span>
                              <span className="d-block text-muted extra-small">{order.ShippingAddress}</span>
                            </div>
                            <div className="col-6 border-start ps-2">
                              <strong className="text-dark small d-block mb-1"><Receipt className="me-1" /> Billing:</strong>
                              <span className="d-block text-dark small">{order.BillingName}</span>
                              <span className="d-block text-muted extra-small">{order.BillingAddress}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stepper Tracker & Actions */}
                        <div className="col-md-6 ps-md-4">
                          {status === 'Cancelled' ? (
                            <div className="alert alert-danger py-2 text-center small rounded-pill mb-4">
                              <XCircle className="me-2" /> This order has been Cancelled.
                            </div>
                          ) : (
                            <div className="stepper-wrapper mb-4">
                              <div className="progress-line-fill" style={{ width: fillWidth }}></div>
                              
                              <div className={`stepper-item ${step1}`}>
                                <div className="step-counter"><Receipt size={16} /></div>
                                <div className="step-name">Placed</div>
                              </div>
                              <div className={`stepper-item ${step2}`}>
                                <div className="step-counter"><RefreshCw size={16} /></div>
                                <div className="step-name">Processing</div>
                              </div>
                              <div className={`stepper-item ${step3}`}>
                                <div className="step-counter"><Truck size={16} /></div>
                                <div className="step-name">Shipped</div>
                              </div>
                              <div className={`stepper-item ${step4}`}>
                                <div className="step-counter"><Home size={16} /></div>
                                <div className="step-name">Delivered</div>
                              </div>
                            </div>
                          )}

                          {/* Invoice Actions */}
                          <div className="d-flex gap-2 mb-3">
                            <button
                              className="btn btn-outline-dark btn-sm rounded-pill px-3 flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                              onClick={() => window.open(`/invoice/${order.ID}`, '_blank')}
                            >
                              <FileText size={16} /> View Invoice
                            </button>
                            <button
                              className="btn btn-primary btn-sm rounded-pill px-3 flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                              onClick={() => window.open(`/invoice/${order.ID}?print=1`, '_blank')}
                            >
                              <Printer size={16} /> Print Invoice
                            </button>
                          </div>

                          {/* Star Rating Widget for Completed Orders */}
                          {status === 'Completed' && (
                            <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                              <span className="text-muted small fw-semibold">Rate this order:</span>
                              <div className="rating-stars d-flex gap-1">
                                {[1, 2, 3, 4, 5].map((starVal) => (
                                  <Star
                                    key={starVal}
                                    className={`rating-star ${starVal <= currentRating ? 'filled text-warning' : 'text-muted'}`}
                                    style={{ cursor: 'pointer', fontSize: '1.2rem', fill: starVal <= currentRating ? '#ffc107' : 'none' }}
                                    onClick={() => handleRateOrder(order.ID, starVal)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
