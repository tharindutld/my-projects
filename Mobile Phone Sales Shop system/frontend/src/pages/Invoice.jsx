import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, ShoppingBag, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, API_URL } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdminView = searchParams.get('isAdmin') === '1';

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchInvoice();
  }, [id, token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading invoice details...</div>;
  }

  if (!order) {
    return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--danger)' }}>Order invoice not found or unauthorized.</div>;
  }

  // Calculate pricing breakdown
  const items = order.items || [];
  let catalogSubtotal = 0;
  let itemsSubtotal = 0;

  items.forEach(item => {
    // If original price is not present, default to item price
    const originalPrice = parseFloat(item.OriginalPrice || item.ProductPrice || 0);
    const soldPrice = parseFloat(item.ProductPrice || 0);
    const qty = parseInt(item.ProductQty || 1);

    catalogSubtotal += (originalPrice * qty);
    itemsSubtotal += (soldPrice * qty);
  });

  const productDiscount = catalogSubtotal > itemsSubtotal ? (catalogSubtotal - itemsSubtotal) : 0;
  
  // Extract loyalty discount from transaction details or difference
  const grandTotal = parseFloat(order.TotalAmount || 0);
  let loyaltyDiscount = 0;
  if (itemsSubtotal > grandTotal) {
    loyaltyDiscount = itemsSubtotal - grandTotal;
  }

  return (
    <div className="container" style={{ paddingBottom: '60px', maxWidth: '850px' }}>
      
      {/* Action buttons (hidden on print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate(isAdminView ? '/admin/orders' : '/my-orders')} className="glass-btn glass-btn-secondary" style={{ borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={14} /> Back to Orders
        </button>
        <button onClick={handlePrint} className="glass-btn" style={{ borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Printer size={14} /> Print Invoice
        </button>
      </div>

      {/* Invoice Card */}
      <div className="glass-panel" style={{ padding: '40px', background: '#fff', color: '#333', borderRadius: '16px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f3f7', paddingBottom: '20px', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={24} /> Mobile Store
            </span>
            <p style={{ color: '#666', fontSize: '13px', marginTop: '8px', lineHeight: '1.5' }}>
              123 Galle Road, Colombo 03, Sri Lanka<br />
              Phone: +94 11 234 5678 | Email: support@mobilestore.com
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', textTransform: 'uppercase', margin: 0, color: 'var(--primary)' }}>Invoice</h1>
            <span style={{ fontSize: '13px', color: '#666', display: 'block', marginTop: '4px' }}>Invoice: <strong>#{order.OrderNumber}</strong></span>
            <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Date: <strong>{new Date(order.OrderDate).toLocaleString()}</strong></span>
            <span style={{
              background: order.OrderStatus === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: order.OrderStatus === 'Completed' ? 'var(--success)' : 'var(--warning)',
              padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', display: 'inline-block', marginTop: '8px'
            }}>{order.OrderStatus}</span>
          </div>
        </div>

        {/* Customer Address Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
          <div>
            <h6 style={{ fontSize: '11px', color: '#888', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Billed To:</h6>
            <h5 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0' }}>{order.BillingName || `${order.FirstName} ${order.LastName}`}</h5>
            <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.5' }}>
              Address: {order.BillingAddress}<br />
              Postal Code: {order.BillingPostalCode}<br />
              Country: {order.BillingCountry}<br />
              Phone: {order.BillingPhone || order.MobileNumber}<br />
              Email: {order.Email}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h6 style={{ fontSize: '11px', color: '#888', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Shipped To:</h6>
            <h5 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0' }}>{order.ShippingName || `${order.FirstName} ${order.LastName}`}</h5>
            <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.5' }}>
              Address: {order.ShippingAddress}<br />
              Postal Code: {order.ShippingPostalCode}<br />
              Country: {order.ShippingCountry}<br />
              Phone: {order.ShippingPhone || order.MobileNumber}
            </p>
          </div>
        </div>

        {/* Invoice items table */}
        <div style={{ marginBottom: '30px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: '10px 0', color: '#666' }}>#</th>
                <th style={{ padding: '10px 0', color: '#666' }}>Product / Variant</th>
                <th style={{ padding: '10px 0', color: '#666', textAlign: 'center' }}>Unit Price</th>
                <th style={{ padding: '10px 0', color: '#666', textAlign: 'center' }}>Quantity</th>
                <th style={{ padding: '10px 0', color: '#666', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 0' }}>{idx + 1}</td>
                  <td style={{ padding: '12px 0' }}>
                    <strong style={{ display: 'block', fontSize: '14px' }}>{item.ProductName}</strong>
                    <span style={{ color: '#888', fontSize: '12px' }}>
                      {item.BrandName} &bull; {item.ModelNumber} &bull; {item.Color} ({item.ROM} / {item.RAM})
                    </span>
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'center' }}>
                    Rs. {parseFloat(item.ProductPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'center' }}>{item.ProductQty}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: '600' }}>
                    Rs. {(parseFloat(item.ProductPrice) * item.ProductQty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Subtotals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '35px' }}>
          <div style={{ width: '100%', maxWidth: '360px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#666' }}>
              <span>Items Subtotal</span>
              <span>Rs. {catalogSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            {productDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--danger)' }}>
                <span>Product Promo Discount</span>
                <span>- Rs. {productDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {loyaltyDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--primary)' }}>
                <span>Loyalty Points Discount</span>
                <span>- Rs. {loyaltyDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#666' }}>
              <span>Shipping & Handling</span>
              <span style={{ color: 'var(--success)', fontWeight: '700' }}>Free</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '16px', color: 'var(--primary)' }}>
              <span>Grand Total</span>
              <span>Rs. {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', fontSize: '13px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
            <div>
              <span style={{ color: '#888', display: 'block' }}>Payment Method:</span>
              <strong>{order.PaymentMethod}</strong>
            </div>
            <div>
              <span style={{ color: '#888', display: 'block' }}>Transaction Details:</span>
              <strong style={{ fontSize: '12px' }}>{order.TransactionDetails || 'None'}</strong>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', color: '#999', fontSize: '11px', marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          Thank you for shopping with us! This is a system-generated invoice.
        </div>

      </div>

    </div>
  );
}
