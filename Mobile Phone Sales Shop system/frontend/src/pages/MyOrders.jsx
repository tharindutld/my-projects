import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, ShoppingBag, History, Search, XCircle, 
  FileText, Printer, Star, Truck, Receipt, 
  Home, RefreshCw, ChevronLeft, ChevronRight
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
  const [ratings, setRatings] = useState({});

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
        <span className="fw-semibold text-slate-300 fs-6">Loading your orders...</span>
      </div>
    );
  }

  return (
    <div className="my-orders-page-dark animate-fade-in py-3">
      <ToastAlert message={error} type="danger" onClose={() => setError('')} />
      <ToastAlert message={success} type="success" onClose={() => setSuccess('')} />

      {/* Header Banner */}
      <div className="glass-panel p-4 mb-4 rounded-4">
        <div className="container d-flex justify-content-between align-items-center flex-wrap gap-3 p-0">
          <div>
            <h2 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
              <Package size={30} className="text-primary-light" /> My Orders
            </h2>
            <p className="text-slate-300 mb-0 fs-6">Track active shipments and view complete purchase history</p>
          </div>
          <button className="glass-btn-secondary py-2 px-3.5 rounded-pill d-flex align-items-center gap-2 fw-semibold" onClick={fetchMyOrders}>
            <RefreshCw size={16} /> Refresh List
          </button>
        </div>
      </div>

      <div className="container mb-5 p-0">
        {/* Responsive Navigation Tabs Container */}
        <div className="orders-tabs-wrapper mb-4">
          <div className="d-flex flex-wrap gap-2 p-2 glass-panel rounded-4">
            <button
              className={`order-tab-item flex-grow-1 flex-sm-grow-0 py-2.5 px-4 rounded-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 ${activeTab === 'current' ? 'active' : ''}`}
              onClick={() => {
                setSearchParams({ tab: 'current' });
                setActiveSearch('');
                setSearchQuery('');
              }}
            >
              <ShoppingBag size={20} /> Current Orders
            </button>
            <button
              className={`order-tab-item flex-grow-1 flex-sm-grow-0 py-2.5 px-4 rounded-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: 'history' })}
            >
              <History size={20} /> Order History
            </button>
          </div>
        </div>

        {/* History Search Filter Bar */}
        {activeTab === 'history' && (
          <div className="glass-panel p-3.5 mb-4 rounded-4">
            <form onSubmit={handleSearchSubmit}>
              <div className="row g-2.5 align-items-center">
                <div className="col-md-9">
                  <div className="search-input-wrapper">
                    <Search size={20} className="search-icon-dark" />
                    <input
                      type="text"
                      className="glass-input ps-5 w-100 fs-6 py-2.5"
                      placeholder="Search past orders by order number, product name, or brand..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3 d-flex gap-2 align-items-center">
                  <button type="submit" className="glass-btn flex-grow-1 py-2.5 rounded-pill fw-semibold fs-6">
                    Filter
                  </button>
                  {searchQuery && (
                    <button 
                      type="button" 
                      className="glass-btn-secondary py-2.5 px-3.5 rounded-pill fs-6"
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
          <div className="glass-panel p-5 text-center rounded-4">
            <div className="py-4">
              <Receipt size={64} className="text-slate-400 mb-3 d-block mx-auto opacity-50" />
              {activeTab === 'current' ? (
                <>
                  <h4 className="fw-bold text-white mb-2">No Current Orders</h4>
                  <p className="text-slate-300 fs-6 mb-4">You do not have any active or processing orders at the moment.</p>
                  <button className="glass-btn rounded-pill px-4 py-2.5 fw-semibold fs-6" onClick={() => navigate('/products')}>
                    Start Shopping
                  </button>
                </>
              ) : (
                <>
                  <h4 className="fw-bold text-white mb-2">No Order History</h4>
                  <p className="text-slate-300 fs-6 mb-4">
                    {activeSearch ? `No past orders found matching '${activeSearch}'.` : 'You have no past completed or cancelled orders.'}
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    {activeSearch && (
                      <button className="glass-btn-secondary rounded-pill px-4 py-2.5 fw-semibold fs-6" onClick={handleClearSearch}>
                        Clear Search
                      </button>
                    )}
                    <button className="glass-btn rounded-pill px-4 py-2.5 fw-semibold fs-6" onClick={() => navigate('/products')}>
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
                  <div key={order.ID} className="glass-panel order-dark-card mb-4 rounded-4 overflow-hidden">
                    
                    {/* Card Header */}
                    <div className="order-header-dark p-3.5 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom border-slate-700">
                      <div>
                        <span className="text-slate-400 text-uppercase d-block fw-semibold" style={{ fontSize: '12px' }}>Order Number</span>
                        <h5 className="fw-bold text-white mb-0" style={{ fontSize: '18px' }}>{order.OrderNumber}</h5>
                      </div>
                      <div className="d-flex align-items-center gap-4">
                        <div>
                          <span className="text-slate-400 text-uppercase d-block text-end fw-semibold" style={{ fontSize: '12px' }}>Order Date</span>
                          <span className="fw-semibold text-slate-200" style={{ fontSize: '14.5px' }}>
                            {new Date(order.OrderDate).toLocaleString(undefined, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="border-start border-slate-700" style={{ height: '28px' }}></span>
                        <div>
                          <span className="text-slate-400 text-uppercase d-block text-end fw-semibold" style={{ fontSize: '12px' }}>Total Amount</span>
                          <span className="fw-bold text-primary-glowing" style={{ fontSize: '19px' }}>
                            Rs. {parseFloat(order.TotalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                      <div className="row g-4">
                        
                        {/* Left Column: Items & Shipping/Payment */}
                        <div className="col-lg-7 border-end-dark pe-lg-4">
                          <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2 fs-6">
                            <Package size={20} className="text-primary-light" /> Purchased Items ({order.items?.length || 0})
                          </h6>
                          
                          <div className="order-items-list d-flex flex-column gap-3 mb-4">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, idx) => (
                                <div key={idx} className="dark-item-row d-flex align-items-center gap-3 p-3 rounded-3 border">
                                  <img 
                                    src={getImageSrc(item.Image1)} 
                                    alt={item.ProductName || 'Product'} 
                                    className="order-item-img-dark rounded-2"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/64?text=Phone'; }}
                                  />
                                  <div className="flex-grow-1 min-w-0">
                                    <h6 className="fw-bold text-white mb-1 text-truncate" style={{ fontSize: '15px' }}>
                                      {item.ProductName || 'Mobile Product'}
                                    </h6>
                                    <div className="text-slate-300" style={{ fontSize: '13.5px' }}>
                                      {item.BrandName} {item.ModelNumber && `• ${item.ModelNumber}`} {item.Color && `• ${item.Color}`}
                                      {(item.ROM || item.RAM) && ` (${item.ROM || ''}${item.RAM ? ' / ' + item.RAM : ''})`}
                                    </div>
                                  </div>
                                  <div className="text-end ps-2">
                                    <div className="fw-bold text-primary-light" style={{ fontSize: '15px' }}>
                                      Rs. {parseFloat(item.ProductPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-slate-400 fw-medium" style={{ fontSize: '13px' }}>Qty: {item.ProductQty}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-slate-300 fs-6">Order details available via Invoice.</div>
                            )}
                          </div>

                          {/* Payment & Shipping Details Section */}
                          <div className="payment-shipping-section row g-3 pt-3 border-top border-slate-700">
                            
                            {/* Shipping Address */}
                            <div className="col-sm-6">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <Truck size={18} className="text-primary-light flex-shrink-0" />
                                <span className="fw-bold text-white fs-6">Shipping Address:</span>
                              </div>
                              <div className="ps-4">
                                <div className="text-slate-100 fw-bold mb-1" style={{ fontSize: '14.5px' }}>
                                  {order.ShippingName || (user?.firstName + ' ' + user?.lastName)}
                                </div>
                                <div className="text-slate-300" style={{ fontSize: '13.5px', lineHeight: '1.45' }}>
                                  {order.ShippingAddress}
                                </div>
                              </div>
                            </div>

                            {/* Payment Method - Clean Gap & Alignment */}
                            <div className="col-sm-6 border-start-dark ps-sm-4 mt-3 mt-sm-0">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <Receipt size={18} className="text-primary-light flex-shrink-0" />
                                <span className="fw-bold text-white fs-6">Payment Method:</span>
                              </div>
                              <div className="ps-4 d-flex flex-column gap-2">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="badge-payment-method px-3 py-1.5 rounded-pill fw-semibold">
                                    {order.PaymentMethod || 'Online Payment'}
                                  </span>
                                </div>
                                {order.TransactionDetails && (
                                  <div className="text-slate-300" style={{ fontSize: '13.5px' }}>
                                    <span className="text-slate-400 fw-medium me-1">Transaction Ref:</span>
                                    <span className="text-slate-200 fw-semibold">{order.TransactionDetails}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Right Column: Tracking & Actions */}
                        <div className="col-lg-5 ps-lg-4 d-flex flex-column justify-content-between">
                          <div>
                            <h6 className="fw-bold text-white mb-3 d-flex align-items-center justify-content-between fs-6">
                              <span>Order Status Tracking</span>
                              <span className={`status-badge-glow ${status === 'Completed' ? 'badge-completed' : status === 'Cancelled' ? 'badge-cancelled' : 'badge-pending'}`}>
                                {status}
                              </span>
                            </h6>

                            {status === 'Cancelled' ? (
                              <div className="dark-alert-danger py-3 text-center fs-6 rounded-3 mb-4">
                                <XCircle className="me-2" size={20} /> This order has been Cancelled.
                              </div>
                            ) : (
                              <div className="stepper-dark-container mb-4 py-2">
                                <div className="stepper-wrapper">
                                  <div className="progress-line-dark-fill" style={{ width: fillWidth }}></div>
                                  
                                  <div className={`stepper-item ${step1}`}>
                                    <div className="step-counter-dark"><Receipt size={15} /></div>
                                    <div className="step-name-dark">Placed</div>
                                  </div>
                                  <div className={`stepper-item ${step2}`}>
                                    <div className="step-counter-dark"><RefreshCw size={15} /></div>
                                    <div className="step-name-dark">Processing</div>
                                  </div>
                                  <div className={`stepper-item ${step3}`}>
                                    <div className="step-counter-dark"><Truck size={15} /></div>
                                    <div className="step-name-dark">Shipped</div>
                                  </div>
                                  <div className={`stepper-item ${step4}`}>
                                    <div className="step-counter-dark"><Home size={15} /></div>
                                    <div className="step-name-dark">Delivered</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            {/* Invoice Buttons */}
                            <div className="d-flex gap-2 mb-3 align-items-center">
                              <button
                                className="glass-btn-secondary flex-grow-1 py-2.5 px-3 rounded-pill d-flex align-items-center justify-content-center gap-2 fw-semibold fs-6"
                                onClick={() => window.open(`/invoice/${order.ID}`, '_blank')}
                              >
                                <FileText size={18} /> View Invoice
                              </button>
                              <button
                                className="glass-btn flex-grow-1 py-2.5 px-3 rounded-pill d-flex align-items-center justify-content-center gap-2 fw-semibold fs-6"
                                onClick={() => window.open(`/invoice/${order.ID}?print=1`, '_blank')}
                              >
                                <Printer size={18} /> Print Invoice
                              </button>
                            </div>

                            {/* Rating Stars Widget for Completed / Delivered Orders */}
                            {(status === 'Completed' || status === 'Delivered') && (
                              <div className="dark-rating-box p-3.5 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <div>
                                  <span className="fw-bold text-white fs-6 d-block">Rate Your Purchase:</span>
                                  <span className="text-slate-300" style={{ fontSize: '13px' }}>How was your ordering experience?</span>
                                </div>
                                <div className="rating-stars d-flex gap-1.5 align-items-center">
                                  {[1, 2, 3, 4, 5].map((starVal) => {
                                    const isFilled = starVal <= currentRating;
                                    return (
                                      <button
                                        key={starVal}
                                        type="button"
                                        className="rating-star-btn bg-transparent border-0 p-1 cursor-pointer"
                                        title={`Rate ${starVal} out of 5 stars`}
                                        onClick={() => handleRateOrder(order.ID, starVal)}
                                      >
                                        <Star
                                          className={`rating-star ${isFilled ? 'filled text-warning' : 'text-slate-400'}`}
                                          style={{ 
                                            width: '24px', 
                                            height: '24px',
                                            fill: isFilled ? '#f59e0b' : 'transparent',
                                            stroke: isFilled ? '#f59e0b' : '#94a3b8'
                                          }}
                                        />
                                      </button>
                                    );
                                  })}
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
                    className="glass-btn-secondary px-4 py-2 rounded-pill d-flex align-items-center gap-1.5 fw-semibold fs-6"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    <ChevronLeft size={18} /> Previous
                  </button>
                  <span className="fw-semibold text-slate-300 fs-6">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="glass-btn-secondary px-4 py-2 rounded-pill d-flex align-items-center gap-1.5 fw-semibold fs-6"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next <ChevronRight size={18} />
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
