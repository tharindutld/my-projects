import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Search, Trash2, CheckCircle, User, 
  Package, Receipt, CreditCard, Calendar, ArrowLeft 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ToastAlert from '../components/ToastAlert';
import ConfirmModal from '../components/ConfirmModal';
import { formatCurrency } from '../utils/format';
import './AddOrder.css';

export default function AddOrder() {
  const { user, token, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [userType, setUserType] = useState('walkin'); // 'walkin' | 'registered'
  
  // Walk-in Fields
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinEmail, setWalkinEmail] = useState('');
  const [walkinAddress, setWalkinAddress] = useState('');

  // Registered Customer Fields
  const [custSearchQuery, setCustSearchQuery] = useState('');
  const [custSearchResults, setCustSearchResults] = useState([]);
  const [custSearching, setCustSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Product Search & Cart
  const [prodSearchQuery, setProdSearchQuery] = useState('');
  const [prodSearchResults, setProdSearchResults] = useState([]);
  const [prodSearching, setProdSearching] = useState(false);
  const [cart, setCart] = useState([]);

  // Order Details
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [orderStatus, setOrderStatus] = useState('Completed');
  const [customOrderDate, setCustomOrderDate] = useState('');
  const [transactionDetails, setTransactionDetails] = useState('');

  // Notifications & Submission Loading
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const role = user?.role || '';
  const isAdmin = role === 'Admin';

  // Customer search debounce
  useEffect(() => {
    if (!custSearchQuery.trim()) {
      setCustSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCustSearching(true);
      try {
        const res = await fetch(`${API_URL}/orders/admin/customers/search?q=${encodeURIComponent(custSearchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCustSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [custSearchQuery, token, API_URL]);

  // Product search debounce
  useEffect(() => {
    if (!prodSearchQuery.trim()) {
      setProdSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setProdSearching(true);
      try {
        const res = await fetch(`${API_URL}/orders/admin/products/search?q=${encodeURIComponent(prodSearchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProdSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setProdSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [prodSearchQuery, token, API_URL]);

  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setCustSearchQuery('');
    setCustSearchResults([]);
  };

  const handleAddProductToCart = (prod) => {
    const existing = cart.find(item => item.id === prod.id);
    if (existing) {
      if (existing.qty >= prod.stock) {
        setError(`Cannot exceed available stock of ${prod.stock} for ${prod.name}`);
        return;
      }
      setCart(cart.map(item => item.id === prod.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      if (prod.stock < 1) {
        setError(`Product ${prod.name} is currently out of stock.`);
        return;
      }
      setCart([...cart, {
        id: prod.id,
        name: prod.name,
        model: prod.model,
        brand: prod.brand,
        price: parseFloat(prod.price),
        stock: prod.stock,
        qty: 1,
        discount: 0
      }]);
    }
    setProdSearchQuery('');
    setProdSearchResults([]);
  };

  const updateQty = (id, newQty) => {
    const qty = parseInt(newQty) || 1;
    setCart(cart.map(item => {
      if (item.id === id) {
        if (qty > item.stock) {
          setError(`Cannot exceed available stock of ${item.stock}`);
          return { ...item, qty: item.stock };
        }
        return { ...item, qty: Math.max(1, qty) };
      }
      return item;
    }));
  };

  const updateDiscount = (id, newDiscount) => {
    const discount = parseFloat(newDiscount) || 0;
    const boundedDiscount = Math.min(100, Math.max(0, discount));
    setCart(cart.map(item => item.id === id ? { ...item, discount: boundedDiscount } : item));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const totalDiscount = cart.reduce((acc, item) => acc + (item.price * item.qty * (item.discount / 100)), 0);
  const grandTotal = subtotal - totalDiscount;

  const executeOrderSubmission = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        user_type: userType,
        customer_id: selectedCustomer?.id || 0,
        walkin_name: walkinName.trim(),
        walkin_phone: walkinPhone.trim(),
        walkin_email: walkinEmail.trim(),
        walkin_address: walkinAddress.trim(),
        payment_method: paymentMethod,
        order_status: orderStatus,
        custom_order_date: customOrderDate,
        transaction_details: transactionDetails,
        items: cart.map(item => ({
          product_id: item.id,
          qty: item.qty,
          discount: item.discount
        }))
      };

      const res = await fetch(`${API_URL}/orders/admin/pos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'In-store order finalized successfully!');
        setTimeout(() => {
          navigate('/admin/orders');
        }, 1500);
      } else {
        setError(data.message || 'Failed to finalize in-store order.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error finalizing order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const errors = {};

    if (cart.length === 0) {
      setError('Please search and add at least one product item to the order.');
      return;
    }

    if (userType === 'registered') {
      if (!selectedCustomer) {
        setError('Please search and select a registered customer profile.');
        return;
      }
    } else {
      const name = walkinName.trim();
      const phone = walkinPhone.trim();
      const email = walkinEmail.trim();
      const address = walkinAddress.trim();

      if (!name || name.length < 2) {
        errors.walkinName = 'Customer Name is required (min 2 chars).';
      } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        errors.walkinName = 'Letters and spaces only.';
      }

      if (!phone || !/^0[0-9]{9}$/.test(phone)) {
        errors.walkinPhone = 'Must be 10 digits starting with 0.';
      }

      if (!email) {
        errors.walkinEmail = 'Email address is required.';
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        errors.walkinEmail = 'Valid email format required.';
      }

      if (!address || address.length < 3) {
        errors.walkinAddress = 'Location / Address required (min 3 chars).';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the highlighted errors in the form.');
      return;
    }

    setFieldErrors({});

    setConfirmModal({
      isOpen: true,
      title: 'Finalize In-Store Order',
      message: `Are you sure you want to process this order for Rs. ${formatCurrency(grandTotal)}?`,
      variant: 'primary',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        executeOrderSubmission();
      }
    });
  };

  return (
    <AdminLayout>
      <div className="add-order-container">
        <ToastAlert message={error} type="danger" onClose={() => setError('')} />
        <ToastAlert message={success} type="success" onClose={() => setSuccess('')} />

        {/* Header */}
        <div className="add-order-header mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
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
              <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }} className="text-white d-flex align-items-center gap-2">
                <PlusCircle className="text-primary" /> Create In-Store Order (POS)
              </h1>
              <p className="mt-1 mb-0" style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>Create new walk-in or member orders, process counter payments & manage inventory stock.</p>
            </div>
            <button 
              className="btn btn-outline-light btn-sm rounded-pill d-flex align-items-center gap-2 px-3"
              onClick={() => navigate('/admin/orders')}
            >
              <ArrowLeft size={16} /> Back to Orders
            </button>
          </div>
        </div>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant || 'primary'}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Form Workspace */}
        <form noValidate onSubmit={handleSubmitOrder}>
          <div className="row g-4">
            
            {/* Left Column: Customer & Products */}
            <div className="col-lg-8">
              
              {/* Customer Details Card */}
              <div className="glass-card mb-4 p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
                    <User className="text-primary" /> Customer Details
                  </h5>
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      type="button"
                      className={`btn ${userType === 'walkin' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => { setUserType('walkin'); setSelectedCustomer(null); }}
                    >
                      Walk-in Customer
                    </button>
                    <button
                      type="button"
                      className={`btn ${userType === 'registered' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setUserType('registered')}
                    >
                      Registered Member
                    </button>
                  </div>
                </div>

                {userType === 'walkin' ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Customer Name <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className={`form-control custom-input ${fieldErrors.walkinName ? 'is-invalid border-danger' : ''}`}
                        placeholder="e.g. Nimal Perera"
                        value={walkinName}
                        onChange={e => { setWalkinName(e.target.value); setFieldErrors(prev => ({ ...prev, walkinName: '' })); }}
                        required
                      />
                      {fieldErrors.walkinName && <div className="text-danger extra-small mt-1">{fieldErrors.walkinName}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                      <input 
                        type="tel" 
                        className={`form-control custom-input ${fieldErrors.walkinPhone ? 'is-invalid border-danger' : ''}`}
                        placeholder="10-digit mobile (e.g. 0771234567)"
                        value={walkinPhone}
                        onChange={e => { setWalkinPhone(e.target.value); setFieldErrors(prev => ({ ...prev, walkinPhone: '' })); }}
                        required
                      />
                      {fieldErrors.walkinPhone && <div className="text-danger extra-small mt-1">{fieldErrors.walkinPhone}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email Address <span className="text-danger">*</span></label>
                      <input 
                        type="email" 
                        className={`form-control custom-input ${fieldErrors.walkinEmail ? 'is-invalid border-danger' : ''}`}
                        placeholder="e.g. customer@gmail.com"
                        value={walkinEmail}
                        onChange={e => { setWalkinEmail(e.target.value); setFieldErrors(prev => ({ ...prev, walkinEmail: '' })); }}
                        required
                      />
                      {fieldErrors.walkinEmail && <div className="text-danger extra-small mt-1">{fieldErrors.walkinEmail}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Location / Address <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className={`form-control custom-input ${fieldErrors.walkinAddress ? 'is-invalid border-danger' : ''}`}
                        placeholder="e.g. Colombo 03"
                        value={walkinAddress}
                        onChange={e => { setWalkinAddress(e.target.value); setFieldErrors(prev => ({ ...prev, walkinAddress: '' })); }}
                        required
                      />
                      {fieldErrors.walkinAddress && <div className="text-danger extra-small mt-1">{fieldErrors.walkinAddress}</div>}
                    </div>
                  </div>
                ) : (
                  <div className="registered-customer-section">
                    {!selectedCustomer ? (
                      <div className="position-relative">
                        <label className="form-label">Search Registered Member</label>
                        <div className="input-group">
                          <span className="input-group-text"><Search size={18} /></span>
                          <input 
                            type="text"
                            className="form-control custom-input"
                            placeholder="Search customer by name, email, or mobile..."
                            value={custSearchQuery}
                            onChange={e => setCustSearchQuery(e.target.value)}
                          />
                        </div>
                        {custSearching && <div className="p-2 text-light small opacity-75">Searching customer catalog...</div>}
                        {custSearchResults.length > 0 && (
                          <div className="search-dropdown-list shadow-lg">
                            {custSearchResults.map(cust => (
                              <div 
                                key={cust.id} 
                                className="search-dropdown-item py-2 px-3 border-bottom"
                                onClick={() => handleSelectCustomer(cust)}
                              >
                                <div className="fw-bold text-white">{cust.name}</div>
                                <div className="text-light small opacity-75">{cust.email} &bull; {cust.phone}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-3 d-flex justify-content-between align-items-center" style={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid #6366f1' }}>
                        <div>
                          <h6 className="fw-bold text-white mb-1">{selectedCustomer.name}</h6>
                          <div className="text-light small opacity-75">{selectedCustomer.email} &bull; Phone: {selectedCustomer.phone}</div>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-outline-danger btn-sm rounded-pill px-3"
                          onClick={() => setSelectedCustomer(null)}
                        >
                          Change Member
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Product Selection Card */}
              <div className="glass-card p-4">
                <h5 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                  <Package className="text-primary" /> Product Item Selection
                </h5>

                <div className="position-relative mb-4">
                  <div className="input-group input-group-lg">
                    <span className="input-group-text"><Search size={20} /></span>
                    <input 
                      type="text"
                      className="form-control custom-input"
                      placeholder="Type product name, brand, or model number to add..."
                      value={prodSearchQuery}
                      onChange={e => setProdSearchQuery(e.target.value)}
                    />
                  </div>
                  {prodSearching && <div className="p-2 text-light small opacity-75">Searching store inventory...</div>}
                  {prodSearchResults.length > 0 && (
                    <div className="search-dropdown-list shadow-lg">
                      {prodSearchResults.map(prod => (
                        <div 
                          key={prod.id} 
                          className="search-dropdown-item py-2 px-3 border-bottom d-flex justify-content-between align-items-center"
                          onClick={() => handleAddProductToCart(prod)}
                        >
                          <div>
                            <span className="fw-bold text-white me-2">{prod.name}</span>
                            <span className="badge bg-primary me-2">{prod.model}</span>
                            <div className="text-light small opacity-75 mt-1">
                              Brand: {prod.brand} &bull; Available Stock: <span className={prod.stock < 5 ? 'text-danger fw-bold' : 'text-success fw-bold'}>{prod.stock} units</span>
                            </div>
                          </div>
                          <div className="text-end fw-bold text-white fs-6">
                            Rs. {formatCurrency(prod.price)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart Table */}
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Product Item</th>
                        <th>Unit Price</th>
                        <th style={{ width: '100px' }}>Qty</th>
                        {isAdmin && <th style={{ width: '130px' }}>Discount (%)</th>}
                        <th>Subtotal</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin ? 6 : 5} className="text-center py-4 text-light opacity-75">
                            <Package size={36} className="d-block mb-2 text-primary opacity-50 mx-auto" />
                            No products added to the order yet. Type product name in search bar above.
                          </td>
                        </tr>
                      ) : (
                        cart.map((item) => {
                          const itemSubtotal = item.price * item.qty;
                          const itemDiscount = itemSubtotal * (item.discount / 100);
                          const itemTotal = itemSubtotal - itemDiscount;

                          return (
                            <tr key={item.id}>
                              <td>
                                <div className="fw-bold text-white">{item.name}</div>
                                <div className="text-light small opacity-75">Model: {item.model} (In Stock: {item.stock})</div>
                              </td>
                              <td className="text-light fw-semibold">
                                Rs. {formatCurrency(item.price)}
                              </td>
                              <td>
                                <input 
                                  type="number"
                                  className="form-control form-control-sm custom-input text-center fw-bold"
                                  min="1"
                                  max={item.stock}
                                  value={item.qty}
                                  onChange={e => updateQty(item.id, e.target.value)}
                                />
                              </td>
                              {isAdmin && (
                                <td>
                                  <div className="input-group input-group-sm" style={{ width: '100px' }}>
                                    <input 
                                      type="number"
                                      className="form-control custom-input text-center fw-bold px-1"
                                      min="0"
                                      max="100"
                                      value={item.discount}
                                      onChange={e => updateDiscount(item.id, e.target.value)}
                                    />
                                    <span className="input-group-text px-2">%</span>
                                  </div>
                                </td>
                              )}
                              <td className="fw-bold text-white">
                                Rs. {formatCurrency(itemTotal)}
                              </td>
                              <td>
                                <button 
                                  type="button" 
                                  className="btn btn-link text-danger p-0"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

            {/* Right Column: Order Summary & Transaction */}
            <div className="col-lg-4">
              <div className="glass-card p-4 sticky-top" style={{ top: '90px' }}>
                <h5 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                  <Receipt className="text-primary" /> Order Summary
                </h5>

                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: '#cbd5e1', fontWeight: '600' }}>Subtotal</span>
                  <span className="fw-bold text-white">Rs. {formatCurrency(subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: '#cbd5e1', fontWeight: '600' }}>Total Discount</span>
                  <span className="fw-bold text-danger">- Rs. {formatCurrency(totalDiscount)}</span>
                </div>
                <hr style={{ borderColor: 'rgba(255, 255, 255, 0.15)', margin: '1rem 0' }} />
                
                <div className="p-3 mb-4 rounded-3 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.2))', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                  <span className="h6 fw-bold text-white mb-0">Grand Total</span>
                  <span className="h4 fw-bold text-white mb-0" style={{ textShadow: '0 2px 10px rgba(99,102,241,0.5)' }}>Rs. {formatCurrency(grandTotal)}</span>
                </div>

                <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                  <CreditCard className="text-primary" /> Payment & Status
                </h6>

                <div className="mb-3">
                  <label className="form-label">Payment Method</label>
                  <select 
                    className="form-select custom-input"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash Payment</option>
                    <option value="Card">Credit / Debit Card</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Order Status</label>
                  <select 
                    className="form-select custom-input"
                    value={orderStatus}
                    onChange={e => setOrderStatus(e.target.value)}
                  >
                    <option value="Completed">Completed (Deduct Stock immediately)</option>
                    <option value="Pending">Pending (Awaiting payment verification)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label d-flex align-items-center gap-1">
                    <Calendar size={15} /> Order Date (Optional Backdate)
                  </label>
                  <input 
                    type="date"
                    className="form-control custom-input form-control-sm"
                    max={new Date().toISOString().slice(0, 10)}
                    value={customOrderDate}
                    onChange={e => setCustomOrderDate(e.target.value)}
                  />
                  <div className="form-text extra-small" style={{ color: '#cbd5e1' }}>Leave empty for current timestamp.</div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Transaction Notes</label>
                  <textarea 
                    className="form-control custom-input"
                    rows={2}
                    placeholder="e.g. Card slip reference, cash change notes..."
                    value={transactionDetails}
                    onChange={e => setTransactionDetails(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2.5 fw-bold rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                  disabled={submitting}
                >
                  <CheckCircle size={20} /> {submitting ? 'Finalizing Order...' : 'Finalize Order'}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
