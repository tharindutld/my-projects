import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  ShoppingBag, Search, Filter, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, 
  FileText, Printer, CheckCircle, Clock, XCircle, Truck, Compass, CheckCheck, 
  RotateCcw, Trash2, Plus, Eye, MapPin, Package, CreditCard, ShieldAlert 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';
import ToastAlert from '../components/ToastAlert';
import { formatCurrency } from '../utils/format';

export default function AdminOrders() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Data States
  const [orders, setOrders] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Collapsible expanded rows state: set of order IDs
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Active Dropdown state: order ID or null
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Toast notifications
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    onConfirm: null
  });

  // Close dropdown when clicking anywhere else on the document
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeDropdownId !== null) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdownId]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const url = new URL(`${API_URL}/orders/admin/list`);
      url.searchParams.append('page', pageParam);
      url.searchParams.append('limit', 10);
      if (filterStatus) url.searchParams.append('status', filterStatus);
      if (searchTerm.trim()) url.searchParams.append('search', searchTerm.trim());

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalResults(data.pagination?.totalResults || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch orders list.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error while fetching orders.');
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
    if (user && user.role === 'Customer') {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [token, user, authLoading, searchParams]);

  // Handle Search & Filter submit
  const handleApplyFilter = (e) => {
    e.preventDefault();
    const newParams = {};
    if (searchTerm.trim()) newParams.search = searchTerm.trim();
    if (filterStatus) newParams.status = filterStatus;
    newParams.page = '1';
    setSearchParams(newParams);
  };

  const handleClearFilter = () => {
    setSearchTerm('');
    setFilterStatus('');
    setSearchParams({});
  };

  // Toggle row details collapse
  const toggleRowExpanded = (orderId) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Handle Update Order Status (Pending / Completed / Cancelled)
  const handleUpdateOrderStatus = (order, newStatus) => {
    setActiveDropdownId(null);
    let msg = `Mark order ${order.OrderNumber} as ${newStatus}?`;
    if (newStatus === 'Cancelled') {
      msg = `Cancel order ${order.OrderNumber}? This will automatically return items to product stock.`;
    } else if (newStatus === 'Completed') {
      msg = `Mark order ${order.OrderNumber} as Completed? This will award customer loyalty points if applicable.`;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Update Order Status',
      message: msg,
      variant: newStatus === 'Cancelled' ? 'danger' : 'primary',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/orders/admin/${order.ID}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
          });
          const data = await res.json();
          if (res.ok) {
            setSuccess(data.message || `Order status updated to ${newStatus}.`);
            fetchOrders();
          } else {
            setError(data.message || 'Failed to update order status.');
          }
        } catch (err) {
          setError('Error updating order status.');
        }
      }
    });
  };

  // Handle Update Delivery Status
  const handleUpdateDeliveryStatus = (order, newDelivery) => {
    setActiveDropdownId(null);
    setConfirmModal({
      isOpen: true,
      title: 'Update Delivery Tracking Status',
      message: `Set delivery status for order ${order.OrderNumber} to "${newDelivery}"?`,
      variant: 'warning',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/orders/admin/${order.ID}/delivery`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ delivery: newDelivery })
          });
          const data = await res.json();
          if (res.ok) {
            setSuccess(data.message || `Delivery status updated to ${newDelivery}.`);
            fetchOrders();
          } else {
            setError(data.message || 'Failed to update delivery status.');
          }
        } catch (err) {
          setError('Error updating delivery status.');
        }
      }
    });
  };

  // Handle Delete Order
  const handleDeleteOrder = (order) => {
    setActiveDropdownId(null);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Order Record',
      message: `PERMANENT ACTION: Are you sure you want to delete Order #${order.OrderNumber}? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/orders/admin/${order.ID}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setSuccess(data.message || 'Order record deleted successfully.');
            fetchOrders();
          } else {
            setError(data.message || 'Failed to delete order record.');
          }
        } catch (err) {
          setError('Error deleting order record.');
        }
      }
    });
  };

  const limit = 10;
  const page = Math.max(1, Math.min(pageParam, totalPages));
  const offset = (page - 1) * limit;

  return (
    <AdminLayout>
      <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1280px' }}>
        
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

        {/* Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <span style={{
              fontSize: '12px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#38bdf8',
              background: 'rgba(56,189,248,0.12)',
              padding: '4px 12px',
              borderRadius: '20px',
              display: 'inline-block',
              marginBottom: '8px'
            }}>Order Fulfillment</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingBag style={{ color: '#818cf8' }} size={28} /> Customer Order Management
            </h1>
          </div>

          <Link 
            to="/admin/add-order" 
            className="glass-btn glass-btn-primary" 
            style={{ borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            <Plus size={18} /> Create In-Store Order (POS)
          </Link>
        </div>

        {/* ── Filter Toolbar ── */}
        <div className="glass-card p-4 mb-4" style={{ borderRadius: '16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <form onSubmit={handleApplyFilter} className="row g-3 align-items-end">
            
            {/* Search Input */}
            <div className="col-md-5">
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                Search Orders
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Order #, Customer Name, Email, Phone, Payment..."
                  className="form-control glass-input"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#f8fafc',
                    paddingLeft: '38px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}
                />
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
              </div>
            </div>

            {/* Order Status Dropdown */}
            <div className="col-md-4">
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                Filter by Order Status
              </label>
              <select
                className="form-select glass-input"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  color: '#f8fafc',
                  borderRadius: '10px',
                  fontSize: '13px',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}
              >
                <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>All Orders (Pending, Completed, Cancelled)</option>
                <option value="Pending" style={{ background: '#0f172a', color: '#fbbf24' }}>Pending</option>
                <option value="Completed" style={{ background: '#0f172a', color: '#34d399' }}>Completed</option>
                <option value="Cancelled" style={{ background: '#0f172a', color: '#f87171' }}>Cancelled</option>
              </select>
            </div>

            {/* Filter & Clear Buttons */}
            <div className="col-md-3 d-flex gap-2">
              <button
                type="submit"
                className="glass-btn glass-btn-primary flex-grow-1 py-2"
                style={{ borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Filter size={15} /> Filter
              </button>

              {(filterStatus || searchTerm) && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="glass-btn glass-btn-secondary py-2 px-3"
                  style={{ borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Clear Filters"
                >
                  <X size={15} /> Clear
                </button>
              )}
            </div>

          </form>
        </div>

        {/* Results Counter Info */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '600' }}>
            Showing {totalResults > 0 ? offset + 1 : 0} - {Math.min(offset + limit, totalResults)} of {totalResults} order(s)
          </span>
        </div>

        {/* ── Table Container ── */}
        <div 
          className="glass-card p-0" 
          style={{ 
            borderRadius: '16px', 
            background: 'rgba(15, 23, 42, 0.85)', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'visible' 
          }}
        >
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table 
              className="table table-dark table-hover align-middle m-0" 
              style={{ 
                background: 'transparent', 
                fontSize: '13px',
                width: '100%',
                tableLayout: 'auto'
              }}
            >
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 14px', width: '50px' }}>S.NO</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Order Number</th>
                  <th style={{ padding: '12px 14px' }}>Customer</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Total Amount</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Payment</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Order Date</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Delivery</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5 text-muted">
                      Loading orders data...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5" style={{ color: '#cbd5e1' }}>
                      <ShoppingBag size={36} className="mb-2 text-secondary opacity-50" />
                      <p className="m-0 fw-bold">No orders found matching the filter.</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((ord, idx) => {
                    const rowNum = offset + idx + 1;
                    const isExpanded = expandedRows.has(ord.ID);
                    const isDropdownOpen = activeDropdownId === ord.ID;

                    const customerFullName = (ord.FirstName ? `${ord.FirstName} ${ord.LastName || ''}`.trim() : '') || ord.ShippingName || 'Walk-in / Customer';
                    const customerEmail = ord.Email || 'No Email';

                    // Fallbacks for address details
                    const shipName = ord.ShippingName || customerFullName;
                    const shipPhone = ord.ShippingPhone || ord.MobileNumber || 'N/A';
                    const shipAddr = ord.ShippingAddress || 'N/A';
                    const shipPostal = ord.ShippingPostalCode || '';
                    const shipCountry = ord.ShippingCountry || '';

                    const billName = ord.BillingName || customerFullName;
                    const billPhone = ord.BillingPhone || ord.MobileNumber || 'N/A';
                    const billAddr = ord.BillingAddress || 'N/A';
                    const billPostal = ord.BillingPostalCode || '';
                    const billCountry = ord.BillingCountry || '';

                    // Badges logic
                    const orderStatus = ord.OrderStatus || 'Pending';
                    const delStatus = ord.DeliveryStatus || 'Processing';

                    let orderBadgeBg = 'rgba(245, 158, 11, 0.15)';
                    let orderBadgeColor = '#fbbf24';
                    if (orderStatus === 'Completed') {
                      orderBadgeBg = 'rgba(16, 185, 129, 0.15)';
                      orderBadgeColor = '#34d399';
                    } else if (orderStatus === 'Cancelled') {
                      orderBadgeBg = 'rgba(239, 68, 68, 0.15)';
                      orderBadgeColor = '#f87171';
                    }

                    let delBadgeBg = 'rgba(100, 116, 139, 0.2)';
                    let delBadgeColor = '#94a3b8';
                    if (delStatus === 'Shipped') {
                      delBadgeBg = 'rgba(99, 102, 241, 0.2)';
                      delBadgeColor = '#818cf8';
                    } else if (delStatus === 'In Transit') {
                      delBadgeBg = 'rgba(14, 165, 233, 0.2)';
                      delBadgeColor = '#38bdf8';
                    } else if (delStatus === 'Delivered') {
                      delBadgeBg = 'rgba(16, 185, 129, 0.2)';
                      delBadgeColor = '#34d399';
                    } else if (delStatus === 'Returned') {
                      delBadgeBg = 'rgba(239, 68, 68, 0.2)';
                      delBadgeColor = '#f87171';
                    }

                    return (
                      <React.Fragment key={ord.ID}>
                        {/* Main Table Row */}
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}>
                          <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{rowNum}</td>
                          
                          {/* Order Number (Collapsible Trigger) */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => toggleRowExpanded(ord.ID)}
                              className="btn btn-link p-0 text-decoration-none fw-bold d-inline-flex align-items-center gap-1"
                              style={{ color: '#38bdf8', fontSize: '13px' }}
                            >
                              {ord.OrderNumber}
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </td>

                          {/* Customer */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: '700', color: '#ffffff' }}>{customerFullName}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{customerEmail}</div>
                          </td>

                          {/* Total Amount */}
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: '#818cf8', whiteSpace: 'nowrap' }}>
                            Rs. {formatCurrency(ord.TotalAmount ?? ord.GrandTotal ?? 0)}
                          </td>

                          {/* Payment Method */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span className="badge px-2 py-1" style={{ background: 'rgba(255,255,255,0.08)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.12)', fontSize: '11px', borderRadius: '6px' }}>
                              <CreditCard size={11} className="me-1" /> {ord.PaymentMethod || 'Card'}
                            </span>
                          </td>

                          {/* Order Date */}
                          <td style={{ padding: '12px 14px', color: '#cbd5e1', whiteSpace: 'nowrap', fontSize: '12px' }}>
                            {ord.OrderDate ? new Date(ord.OrderDate).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </td>

                          {/* Order Status */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              background: orderBadgeBg,
                              color: orderBadgeColor,
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '700',
                              whiteSpace: 'nowrap',
                              display: 'inline-block'
                            }}>
                              {orderStatus}
                            </span>
                          </td>

                          {/* Delivery Status */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              background: delBadgeBg,
                              color: delBadgeColor,
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '700',
                              whiteSpace: 'nowrap',
                              display: 'inline-block'
                            }}>
                              {delStatus}
                            </span>
                          </td>

                          {/* Actions Dropdown Cell */}
                          <td style={{ padding: '12px 14px', textAlign: 'center', position: 'relative' }}>
                            <div className="position-relative d-inline-block">
                              <button
                                type="button"
                                className="glass-btn glass-btn-secondary py-1 px-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(prev => prev === ord.ID ? null : ord.ID);
                                }}
                                style={{ borderRadius: '16px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                Manage <ChevronDown size={13} />
                              </button>

                              {isDropdownOpen && (
                                <div
                                  className="shadow-lg p-2 animate-fade-in"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    marginTop: '4px',
                                    zIndex: 1000,
                                    minWidth: '210px',
                                    background: 'rgba(15, 23, 42, 0.98)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '12px',
                                    textAlign: 'left'
                                  }}
                                >
                                  {/* View / Print Invoice */}
                                  <a
                                    href={`/invoice/${ord.ID}?isAdmin=1`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="dropdown-item text-white py-1 px-2 rounded mb-1 d-flex align-items-center gap-2"
                                    style={{ fontSize: '12px' }}
                                    onClick={() => setActiveDropdownId(null)}
                                  >
                                    <FileText size={14} className="text-primary" /> View Invoice
                                  </a>
                                  <a
                                    href={`/invoice/${ord.ID}?print=1&isAdmin=1`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="dropdown-item text-white py-1 px-2 rounded mb-1 d-flex align-items-center gap-2"
                                    style={{ fontSize: '12px' }}
                                    onClick={() => setActiveDropdownId(null)}
                                  >
                                    <Printer size={14} className="text-info" /> Print Invoice
                                  </a>

                                  <div className="dropdown-divider my-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                                  <div className="px-2 py-1 text-muted fw-bold" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Order Status
                                  </div>
                                  {orderStatus !== 'Completed' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOrderStatus(ord, 'Completed')}
                                      className="dropdown-item text-success py-1 px-2 rounded mb-1 d-flex align-items-center gap-2"
                                      style={{ fontSize: '12px', background: 'transparent', border: 'none', width: '100%' }}
                                    >
                                      <CheckCircle size={14} /> Mark Completed
                                    </button>
                                  )}
                                  {orderStatus !== 'Pending' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOrderStatus(ord, 'Pending')}
                                      className="dropdown-item text-warning py-1 px-2 rounded mb-1 d-flex align-items-center gap-2"
                                      style={{ fontSize: '12px', background: 'transparent', border: 'none', width: '100%' }}
                                    >
                                      <Clock size={14} /> Mark Pending
                                    </button>
                                  )}
                                  {orderStatus !== 'Cancelled' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOrderStatus(ord, 'Cancelled')}
                                      className="dropdown-item text-danger py-1 px-2 rounded mb-1 d-flex align-items-center gap-2"
                                      style={{ fontSize: '12px', background: 'transparent', border: 'none', width: '100%' }}
                                    >
                                      <XCircle size={14} /> Cancel Order
                                    </button>
                                  )}

                                  {orderStatus !== 'Cancelled' && (
                                    <>
                                      <div className="dropdown-divider my-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                                      <div className="px-2 py-1 text-muted fw-bold" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Delivery Status
                                      </div>
                                      {['Processing', 'Shipped', 'In Transit', 'Delivered', 'Returned'].map(st => (
                                        <button
                                          key={st}
                                          type="button"
                                          onClick={() => handleUpdateDeliveryStatus(ord, st)}
                                          className={`dropdown-item py-1 px-2 rounded mb-1 d-flex align-items-center gap-2 ${delStatus === st ? 'active text-primary' : 'text-white'}`}
                                          style={{ fontSize: '12px', background: 'transparent', border: 'none', width: '100%' }}
                                        >
                                          <Truck size={13} /> {st}
                                        </button>
                                      ))}
                                    </>
                                  )}

                                  {user?.role === 'Admin' && (
                                    <>
                                      <div className="dropdown-divider my-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteOrder(ord)}
                                        className="dropdown-item text-danger py-1 px-2 rounded d-flex align-items-center gap-2"
                                        style={{ fontSize: '12px', background: 'transparent', border: 'none', width: '100%' }}
                                      >
                                        <Trash2 size={14} /> Delete Order
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Collapsible Details Table Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="9" className="p-0 border-0">
                              <div className="p-4 animate-fade-in" style={{ background: 'rgba(30, 41, 59, 0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <div className="row g-4">
                                  
                                  {/* Ordered Line Items */}
                                  <div className="col-md-6 border-end border-secondary">
                                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#818cf8', fontSize: '14px' }}>
                                      <Package size={16} /> Purchased Products
                                    </h6>
                                    
                                    {(!ord.items || ord.items.length === 0) ? (
                                      <div className="text-muted small">No line items available for this order.</div>
                                    ) : (
                                      <div className="d-flex flex-column gap-2">
                                        {ord.items.map((item, itemIdx) => (
                                          <div key={itemIdx} className="glass-card p-2 px-3 d-flex justify-content-between align-items-center" style={{ borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)' }}>
                                            <div>
                                              <div className="fw-bold text-white small">{item.ProductName}</div>
                                              <div className="text-muted" style={{ fontSize: '11px' }}>
                                                ({item.ModelNumber}) &bull; {item.Color}
                                                {(item.ROM || item.RAM) && ` (${item.ROM} / ${item.RAM})`}
                                              </div>
                                            </div>
                                            <div className="text-end">
                                              <div className="fw-bold text-primary small">Rs. {formatCurrency(item.ProductPrice)}</div>
                                              <div className="text-muted" style={{ fontSize: '11px' }}>Qty: {item.ProductQty}</div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Shipping & Billing Address Info */}
                                  <div className="col-md-6">
                                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#38bdf8', fontSize: '14px' }}>
                                      <MapPin size={16} /> Shipping & Billing Details
                                    </h6>

                                    <div className="row g-3 mb-3">
                                      {/* Shipping Address */}
                                      <div className="col-6">
                                        <div className="p-3 glass-card h-100" style={{ borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', fontSize: '12px' }}>
                                          <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '4px' }}>Shipping Address:</strong>
                                          <div><strong className="text-white">Name:</strong> {shipName}</div>
                                          <div><strong className="text-white">Address:</strong> {shipAddr}</div>
                                          <div><strong className="text-white">ZIP/Country:</strong> {shipPostal} {shipCountry}</div>
                                          <div><strong className="text-white">Phone:</strong> {shipPhone}</div>
                                        </div>
                                      </div>

                                      {/* Billing Address */}
                                      <div className="col-6">
                                        <div className="p-3 glass-card h-100" style={{ borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', fontSize: '12px' }}>
                                          <strong style={{ color: '#34d399', display: 'block', marginBottom: '4px' }}>Billing Address:</strong>
                                          <div><strong className="text-white">Name:</strong> {billName}</div>
                                          <div><strong className="text-white">Address:</strong> {billAddr}</div>
                                          <div><strong className="text-white">ZIP/Country:</strong> {billPostal} {billCountry}</div>
                                          <div><strong className="text-white">Phone:</strong> {billPhone}</div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Transaction Details / Notes */}
                                    <div className="p-3 glass-card" style={{ borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', fontSize: '12px' }}>
                                      <strong className="text-white d-block mb-1">Transaction Details & Notes:</strong>
                                      <span className="text-muted">{ord.TransactionDetails || 'No additional transaction notes.'}</span>
                                    </div>
                                  </div>

                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Standard Numeric Pagination ── */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-2 p-3 border-top border-secondary">
              <button
                disabled={page <= 1}
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: (page - 1).toString() })}
                className="glass-btn glass-btn-secondary py-1 px-3"
                style={{ borderRadius: '8px', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={15} /> Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="text-muted" style={{ fontSize: '12px' }}>...</span>}
                    <button
                      onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })}
                      className={page === p ? 'glass-btn glass-btn-primary' : 'glass-btn glass-btn-secondary'}
                      style={{ borderRadius: '8px', fontSize: '12px', minWidth: '32px', padding: '4px 10px' }}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}

              <button
                disabled={page >= totalPages}
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: (page + 1).toString() })}
                className="glass-btn glass-btn-secondary py-1 px-3"
                style={{ borderRadius: '8px', fontSize: '12px', opacity: page >= totalPages ? 0.4 : 1 }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}

        </div>

      </div>
    </AdminLayout>
  );
}
