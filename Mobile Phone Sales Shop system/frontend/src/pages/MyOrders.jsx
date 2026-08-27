import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, ShoppingBag, History, Search, XCircle, 
  FileText, Printer, Star, Truck, Receipt, 
  Home, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ToastAlert from '../components/ToastAlert';
import './MyOrders.css';

export default function MyOrders() {
  const { user, token, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'current';
  const initialSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ratings, setRatings] = useState({}); // orderId -> rating

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

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

  // Reset pagination when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    if (searchQuery.trim()) {
      setSearchParams({ tab: 'history', search: searchQuery.trim() });
    } else {
      setSearchParams({ tab: 'history' });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setSearchParams({ tab: 'history' });
  };

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
      if (!activeSearch.trim()) return true;
      const q = activeSearch.toLowerCase();
      const matchNum = order.OrderNumber?.toLowerCase().includes(q);
      const matchDetails = order.TransactionDetails?.toLowerCase().includes(q);
      const matchItems = order.items?.some(item => 
        item.ProductName?.toLowerCase().includes(q) || 
        item.BrandName?.toLowerCase().includes(q) ||
        item.ModelNumber?.toLowerCase().includes(q)
      );
      return matchNum || matchDetails || matchItems;
    }
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getImageSrc = (imgPath) => {
    if (!imgPath) return '/images/no-image.png';
    if (imgPath.startsWith('http')) return imgPath;
    if (imgPath.startsWith('/')) return imgPath;
    return `/${imgPath}`;
  };

  if (loading) {
    return (
      <div className="container py-5 text-center my-orders-loading">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span className="fw-semibold text-muted">Loading your orders...</span>
      </div>
    );
  }

  return (
    <div className="my-orders-page animate-fade-in">
      <ToastAlert message={error} type="danger" onClose={() => setError('')} />
      <ToastAlert message={success} type="success" onClose={() => setSuccess('')} />

      {/* Page Header */}
      <div className="my-orders-header py-4 mb-4">
        <div className="container d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h2 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
              <Package size={30} /> My Orders
            </h2>
            <p className="text-white-50 mb-0 small">Track your active shipments and view your purchase history</p>
          </div>
          <button className="btn btn-outline-light btn-sm rounded-pill px-3" onClick={fetchMyOrders}>
            <RefreshCw size={14} className="me-1" /> Refresh
          </button>
        </div>
      </div>

      <div className="container mb-5">
        {/* Navigation Tabs */}
        <div className="d-flex justify-content-center mb-4">
          <div className="nav nav-pills custom-pill-tabs p-1 bg-white rounded-pill shadow-sm border">
            <button
              className={`nav-link rounded-pill py-2 px-4 fw-semibold ${activeTab === 'current' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`}
              onClick={() => {
                setSearchParams({ tab: 'current' });
                setActiveSearch('');
                setSearchQuery('');
              }}
            >
              <ShoppingBag className="me-2" size={18} /> Current Orders
            </button>
            <button
              className={`nav-link rounded-pill py-2 px-4 fw-semibold ${activeTab === 'history' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`}
              onClick={() => setSearchParams({ tab: 'history' })}
            >
              <History className="me-2" size={18} /> Order History
            </button>
          </div>
        </div>

        {/* History Search Bar */}
        {activeTab === 'history' && (
          <div className="card shadow-sm border-0 mb-4 rounded-4 bg-white p-3 search-card">
            <form onSubmit={handleSearchSubmit}>
              <div className="row g-2 align-items-center">
                <div className="col-md-9">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0 text-muted"><Search size={18} /></span>
                    <input
                      type="text"
                      className="form-control bg-light border-0"
                      placeholder="Search past orders by order number, product name, or brand..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3 d-flex gap-2">
                  <button type="submit" className="btn btn-primary w-100 py-2 rounded-pill fw-semibold">
                    Filter
                  </button>
                  {searchQuery && (
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary py-2 rounded-pill"
                      onClick={handleClearSearch}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Orders List / Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white empty-orders-card">
            <div className="py-4">
              <Receipt size={64} className="text-muted mb-3 d-block mx-auto opacity-50" />
              {activeTab === 'current' ? (
                <>
                  <h4 className="fw-bold text-dark mb-2">No Current Orders</h4>
                  <p className="text-muted mb-4">You do not have any pending or processing orders at the moment.</p>
                  <button className="btn btn-primary rounded-pill px-4 py-2 fw-semibold" onClick={() => navigate('/products')}>
                    Start Shopping
                  </button>
                </>
              ) : (
                <>
                  <h4 className="fw-bold text-dark mb-2">No Order History</h4>
                  <p className="text-muted mb-4">
                    {activeSearch ? `No completed orders found matching '${activeSearch}'.` : 'You do not have any completed or cancelled orders.'}
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    {activeSearch && (
                      <button className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-semibold" onClick={handleClearSearch}>
                        Clear Search
                      </button>
                    )}
                    <button className="btn btn-primary rounded-pill px-4 py-2 fw-semibold" onClick={() => navigate('/products')}>
                      Start Shopping
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-12">
              {paginatedOrders.map((order) => {
                const status = order.OrderStatus;
                const delStatus = order.DeliveryStatus || 'Processing';
                const currentRating = ratings[order.ID] || 0;

                // Stepper logic matching legacy PHP
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
                        <span className="text-muted extra-small text-uppercase d-block fw-semibold">Order Number</span>
                        <h6 className="fw-bold text-dark mb-0">{order.OrderNumber}</h6>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div>
                          <span className="text-muted extra-small text-uppercase d-block text-end fw-semibold">Order Date</span>
                          <span className="fw-semibold text-dark small">
                            {new Date(order.OrderDate).toLocaleString(undefined, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="border-start" style={{ height: '24px' }}></span>
                        <div>
                          <span className="text-muted extra-small text-uppercase d-block text-end fw-semibold">Total Amount</span>
                          <span className="fw-bold text-primary">
                            Rs. {parseFloat(order.TotalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="card-body p-4">
                      <div className="row g-4">
                        
                        {/* Left Column: Product Items */}
                        <div className="col-lg-7 border-end-lg pe-lg-4">
                          <h6 className="fw-bold text-secondary mb-3 d-flex align-items-center gap-2">
                            <Package size={18} /> Purchased Items ({order.items?.length || 0})
                          </h6>
                          <div className="order-items-list d-flex flex-column gap-3 mb-3">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, idx) => (
                                <div key={idx} className="order-item-row d-flex align-items-center gap-3 p-2 rounded-3 bg-light-subtle border">
                                  <img 
                                    src={getImageSrc(item.Image1)} 
                                    alt={item.ProductName || 'Product'} 
                                    className="order-item-img rounded-2 border"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=Phone'; }}
                                  />
                                  <div className="flex-grow-1 min-w-0">
                                    <h6 className="fw-bold text-dark mb-1 text-truncate" style={{ fontSize: '14px' }}>
                                      {item.ProductName || 'Mobile Product'}
                                    </h6>
                                    <div className="text-muted extra-small">
                                      {item.BrandName} {item.ModelNumber && `• ${item.ModelNumber}`} {item.Color && `• ${item.Color}`}
                                      {(item.ROM || item.RAM) && ` (${item.ROM || ''}${item.RAM ? ' / ' + item.RAM : ''})`}
                                    </div>
                                  </div>
                                  <div className="text-end ps-2">
                                    <div className="fw-bold text-dark small">
                                      Rs. {parseFloat(item.ProductPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-muted extra-small">Qty: {item.ProductQty}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-muted small">Order details available via Invoice.</div>
                            )}
                          </div>

                          {/* Payment & Address details */}
                          <div className="row g-2 mt-2 pt-3 border-top text-muted extra-small">
                            <div className="col-sm-6">
                              <strong className="text-dark d-block mb-1"><Truck size={14} className="me-1" /> Shipping Address:</strong>
                              <div className="text-dark fw-semibold">{order.ShippingName || user?.firstName + ' ' + user?.lastName}</div>
                              <div>{order.ShippingAddress}</div>
                            </div>
                            <div className="col-sm-6 border-start-sm ps-sm-3">
                              <strong className="text-dark d-block mb-1"><Receipt size={14} className="me-1" /> Payment Method:</strong>
                              <span className="badge bg-light text-dark border me-2">{order.PaymentMethod}</span>
                              {order.TransactionDetails && <div className="mt-1">{order.TransactionDetails}</div>}
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Tracking Stepper & Actions */}
                        <div className="col-lg-5 ps-lg-4 d-flex flex-column justify-content-between">
                          <div>
                            <h6 className="fw-bold text-secondary mb-3 d-flex align-items-center justify-content-between">
                              <span>Order Status Tracking</span>
                              <span className={`badge ${status === 'Completed' ? 'bg-success' : status === 'Cancelled' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                {status}
                              </span>
                            </h6>

                            {status === 'Cancelled' ? (
                              <div className="alert alert-danger py-3 text-center small rounded-3 mb-4">
                                <XCircle className="me-2" size={20} /> This order has been Cancelled.
                              </div>
                            ) : (
                              <div className="stepper-container mb-4 py-2">
                                <div className="stepper-wrapper">
                                  <div className="progress-line-fill" style={{ width: fillWidth }}></div>
                                  
                                  <div className={`stepper-item ${step1}`}>
                                    <div className="step-counter"><Receipt size={14} /></div>
                                    <div className="step-name">Placed</div>
                                  </div>
                                  <div className={`stepper-item ${step2}`}>
                                    <div className="step-counter"><RefreshCw size={14} /></div>
                                    <div className="step-name">Processing</div>
                                  </div>
                                  <div className={`stepper-item ${step3}`}>
                                    <div className="step-counter"><Truck size={14} /></div>
                                    <div className="step-name">Shipped</div>
                                  </div>
                                  <div className={`stepper-item ${step4}`}>
                                    <div className="step-counter"><Home size={14} /></div>
                                    <div className="step-name">Delivered</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            {/* Invoice Buttons */}
                            <div className="d-flex gap-2 mb-3">
                              <button
                                className="btn btn-outline-dark btn-sm rounded-pill px-3 flex-grow-1 d-flex align-items-center justify-content-center gap-1 py-2 fw-semibold"
                                onClick={() => window.open(`/invoice/${order.ID}`, '_blank')}
                              >
                                <FileText size={16} /> View Invoice
                              </button>
                              <button
                                className="btn btn-primary btn-sm rounded-pill px-3 flex-grow-1 d-flex align-items-center justify-content-center gap-1 py-2 fw-semibold"
                                onClick={() => window.open(`/invoice/${order.ID}?print=1`, '_blank')}
                              >
                                <Printer size={16} /> Print Invoice
                              </button>
                            </div>

                            {/* Rating Widget for Completed Orders */}
                            {status === 'Completed' && (
                              <div className="rating-widget-box p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <div>
                                  <span className="fw-semibold text-dark small d-block">Rate Your Purchase:</span>
                                  <span className="extra-small text-muted">How was your ordering experience?</span>
                                </div>
                                <div className="rating-stars d-flex gap-1">
                                  {[1, 2, 3, 4, 5].map((starVal) => (
                                    <Star
                                      key={starVal}
                                      className={`rating-star ${starVal <= currentRating ? 'filled text-warning' : 'text-muted'}`}
                                      style={{ 
                                        cursor: 'pointer', 
                                        width: '22px', 
                                        height: '22px',
                                        fill: starVal <= currentRating ? '#ffc107' : 'none' 
                                      }}
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
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
                  <button
                    className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="fw-semibold small text-muted">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
