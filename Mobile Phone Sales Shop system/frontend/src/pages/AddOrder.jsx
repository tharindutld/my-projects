import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Search, Trash2, CheckCircle, User, 
  Package, Receipt, CreditCard, Calendar, ArrowLeft 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ToastAlert from '../components/ToastAlert';
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

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (cart.length === 0) {
      setError('Please search and add at least one product to the order before finalizing.');
      return;
    }

    if (userType === 'registered') {
      if (!selectedCustomer) {
        setError('Please search and select a registered customer profile.');
        return;
      }
    } else {
      // Validate Walk-in fields
      const name = walkinName.trim();
      const phone = walkinPhone.trim();
      const email = walkinEmail.trim();
      const address = walkinAddress.trim();

      if (!name || name.length < 2) {
        setError('Customer Name is mandatory and must be at least 2 characters long.');
        return;
      }
      if (!/^[a-zA-Z\s]+$/.test(name)) {
        setError('Customer Name must contain only letters and spaces. Numbers, hyphens, and special characters are not allowed.');
        return;
      }
      if (!phone || !/^0[0-9]{9}$/.test(phone)) {
        setError('Phone Number is mandatory and must be a valid 10-digit Sri Lankan phone number starting with 0 (e.g., 0771234567).');
        return;
      }
      if (!email) {
        setError('Email Address is mandatory.');
        return;
      }
      if ((email.match(/@/g) || []).length !== 1) {
        setError('Email Address must contain exactly ONE "@" symbol (e.g. customer@domain.com).');
        return;
      }
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        setError('Please enter a valid single-@ email address.');
        return;
      }
      if (!address || address.length < 3) {
        setError('Location / Address is mandatory and must be at least 3 characters long.');
        return;
      }
    }

    setSubmitting(true);

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
          navigate('/admin/orders.php');
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

  return (
    <AdminLayout>
      <div className="add-order-container">
        <ToastAlert message={error} type="danger" onClose={() => setError('')} />
        <ToastAlert message={success} type="success" onClose={() => setSuccess('')} />

        {/* Header */}
        <div className="add-order-header mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
                <PlusCircle className="text-primary" /> Create In-Store Order (POS)
              </h3>
              <p className="text-muted small mb-0">Create new walk-in or member orders, process counter payments & manage inventory stock.</p>
            </div>
            <button 
              className="btn btn-outline-light btn-sm rounded-pill d-flex align-items-center gap-2 px-3"
              onClick={() => navigate('/admin/orders.php')}
            >
              <ArrowLeft /> Back to Orders
            </button>
          </div>
        </div>

        {/* Form Workspace */}
        <form onSubmit={handleSubmitOrder}>
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
                      <label className="form-label text-light small fw-semibold">Customer Name <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control custom-input" 
                        placeholder="e.g. Nimal Perera"
                        value={walkinName}
                        onChange={e => setWalkinName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-light small fw-semibold">Phone Number <span className="text-danger">*</span></label>
                      <input 
                        type="tel" 
                        className="form-control custom-input" 
                        placeholder="10-digit mobile (e.g. 0771234567)"
                        value={walkinPhone}
                        onChange={e => setWalkinPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-light small fw-semibold">Email Address <span className="text-danger">*</span></label>
                      <input 
                        type="email" 
                        className="form-control custom-input" 
                        placeholder="e.g. customer@gmail.com"
                        value={walkinEmail}
                        onChange={e => setWalkinEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-light small fw-semibold">Location / Address <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control custom-input" 
                        placeholder="e.g. Colombo 03"
                        value={walkinAddress}
                        onChange={e => setWalkinAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="registered-customer-section">
                    {!selectedCustomer ? (
                      <div className="position-relative">
                        <label className="form-label text-light small fw-semibold">Search Registered Member</label>
                        <div className="input-group">
                          <span className="input-group-text bg-dark border-secondary text-muted"><Search /></span>
                          <input 
                            type="text"
                            className="form-control custom-input"
                            placeholder="Search customer by name, email, or mobile..."
                            value={custSearchQuery}
                            onChange={e => setCustSearchQuery(e.target.value)}
                          />
                        </div>
                        {custSearching && <div className="p-2 text-muted small">Searching...</div>}
                        {custSearchResults.length > 0 && (
                          <div className="search-dropdown-list shadow-lg">
                            {custSearchResults.map(cust => (
                              <div 
                                key={cust.id} 
                                className="search-dropdown-item py-2 px-3 border-bottom"
                                onClick={() => handleSelectCustomer(cust)}
                              >
                                <div className="fw-bold text-white">{cust.name}</div>
                                <div className="text-muted small">{cust.email} &bull; {cust.phone}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-dark border border-primary rounded-3 d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="fw-bold text-primary mb-1">{selectedCustomer.name}</h6>
                          <div className="text-muted small">{selectedCustomer.email} &bull; Phone: {selectedCustomer.phone}</div>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-outline-danger btn-sm rounded-pill"
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
                    <span className="input-group-text bg-dark border-secondary text-muted"><Search /></span>
                    <input 
                      type="text"
                      className="form-control custom-input"
                      placeholder="Type product name, brand, or model number..."
                      value={prodSearchQuery}
                      onChange={e => setProdSearchQuery(e.target.value)}
                    />
                  </div>
                  {prodSearching && <div className="p-2 text-muted small">Searching products...</div>}
                  {prodSearchResults.length > 0 && (
                    <div className="search-dropdown-list shadow-lg">
                      {prodSearchResults.map(prod => (
                        <div 
                          key={prod.id} 
                          className="search-dropdown-item py-2 px-3 border-bottom d-flex justify-content-between align-items-center"
                          onClick={() => handleAddProductToCart(prod)}
                        >
                          <div>
                            <span className="fw-bold text-white">{prod.name}</span>
                            <span className="badge bg-secondary ms-2 small">{prod.model}</span>
                            <div className="text-muted small">Brand: {prod.brand} &bull; Stock: <span className={prod.stock < 5 ? 'text-danger fw-bold' : 'text-success'}>{prod.stock}</span></div>
                          </div>
                          <div className="text-end fw-bold text-primary">
                            Rs. {parseFloat(prod.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart Table */}
                <div className="table-responsive">
                  <table className="table table-dark align-middle mb-0">
                    <thead>
                      <tr className="text-muted border-secondary">
                        <th>Product Item</th>
                        <th>Unit Price</th>
                        <th style={{ width: '100px' }}>Qty</th>
                        {isAdmin && <th style={{ width: '110px' }}>Discount (%)</th>}
                        <th>Subtotal</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin ? 6 : 5} className="text-center py-4 text-muted">
                            <Package size={32} className="d-block mb-2 text-secondary mx-auto" />
                            No products added to the order yet. Search above to add items.
                          </td>
                        </tr>
                      ) : (
                        cart.map((item) => {
                          const itemSubtotal = item.price * item.qty;
                          const itemDiscount = itemSubtotal * (item.discount / 100);
                          const itemTotal = itemSubtotal - itemDiscount;

                          return (
                            <tr key={item.id} className="border-secondary">
                              <td>
                                <div className="fw-bold text-white">{item.name}</div>
                                <div className="text-muted small">Model: {item.model} (In Stock: {item.stock})</div>
                              </td>
                              <td className="text-light">
                                Rs. {item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td>
                                <input 
                                  type="number"
                                  className="form-control form-control-sm custom-input text-center"
                                  min="1"
                                  max={item.stock}
                                  value={item.qty}
                                  onChange={e => updateQty(item.id, e.target.value)}
                                />
                              </td>
                              {isAdmin && (
                                <td>
                                  <div className="input-group input-group-sm">
                                    <input 
                                      type="number"
                                      className="form-control custom-input text-center"
                                      min="0"
                                      max="100"
                                      value={item.discount}
                                      onChange={e => updateDiscount(item.id, e.target.value)}
                                    />
                                    <span className="input-group-text bg-dark border-secondary text-muted">%</span>
                                  </div>
                                </td>
                              )}
                              <td className="fw-bold text-primary">
                                Rs. {itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  <span className="text-muted">Subtotal</span>
                  <span className="fw-semibold text-light">Rs. {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Total Discount</span>
                  <span className="fw-semibold text-danger">- Rs. {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <hr className="border-secondary my-3" />
                <div className="d-flex justify-content-between mb-4">
                  <span className="h6 fw-bold text-white mb-0">Grand Total</span>
                  <span className="h5 fw-bold text-primary mb-0">Rs. {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <h6 className="fw-bold text-light mb-3 d-flex align-items-center gap-2">
                  <CreditCard className="text-primary" /> Payment & Status
                </h6>

                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">Payment Method</label>
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
                  <label className="form-label text-muted small fw-semibold">Order Status</label>
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
                  <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
                    <Calendar /> Order Date (Optional Backdate)
                  </label>
                  <input 
                    type="date"
                    className="form-control custom-input form-control-sm"
                    max={new Date().toISOString().slice(0, 10)}
                    value={customOrderDate}
                    onChange={e => setCustomOrderDate(e.target.value)}
                  />
                  <div className="form-text extra-small text-muted">Leave empty for current timestamp.</div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted small fw-semibold">Transaction Notes</label>
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
