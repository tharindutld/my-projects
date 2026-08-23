import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Award, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { user, token, loading: authLoading, API_URL } = useAuth();
  const { cartItems, getCartSubtotal, fetchCart } = useCart();
  const navigate = useNavigate();

  // Shipping Form State
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingCountry, setShippingCountry] = useState('Sri Lanka');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);

  // Billing Form State
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingName, setBillingName] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [billingCountry, setBillingCountry] = useState('Sri Lanka');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');

  // Loyalty Points
  const [redeemPoints, setRedeemPoints] = useState(0);

  // Status State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate('/login');
    }
  }, [token, authLoading]);

  const subtotal = getCartSubtotal();
  const availablePoints = user?.loyaltyPoints || 0;
  const loyaltyDiscount = Math.min(redeemPoints, availablePoints, Math.floor(subtotal));
  const finalTotal = Math.max(0, subtotal - loyaltyDiscount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (!shippingName || !shippingPhone || !shippingAddress || !shippingPostalCode) {
      setError('Please fill in all required shipping fields.');
      return;
    }

    if (!/^0[0-9]{9}$/.test(shippingPhone)) {
      setError('Phone number must be exactly 10 digits starting with 0.');
      return;
    }

    if (!/^[0-9]{5}$/.test(shippingPostalCode)) {
      setError('Postal code must be exactly 5 digits.');
      return;
    }

    if (!/^[a-zA-Z0-9\s,\.\-\/]+$/.test(shippingAddress)) {
      setError('Shipping address contains invalid characters.');
      return;
    }

    if (!sameAsShipping) {
      if (!billingName || !billingPhone || !billingAddress || !billingPostalCode) {
        setError('Please fill in all required billing fields.');
        return;
      }
      if (!/^0[0-9]{9}$/.test(billingPhone)) {
        setError('Billing phone number must be exactly 10 digits starting with 0.');
        return;
      }
      if (!/^[0-9]{5}$/.test(billingPostalCode)) {
        setError('Billing postal code must be exactly 5 digits.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shippingName,
          shippingPhone,
          shippingCountry,
          shippingAddress,
          shippingPostalCode,
          billingName: sameAsShipping ? shippingName : billingName,
          billingPhone: sameAsShipping ? shippingPhone : billingPhone,
          billingCountry: sameAsShipping ? shippingCountry : billingCountry,
          billingAddress: sameAsShipping ? shippingAddress : billingAddress,
          billingPostalCode: sameAsShipping ? shippingPostalCode : billingPostalCode,
          paymentMethod: 'Card',
          redeemPoints: redeemPoints,
          saveAddress: saveAddress
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Checkout failed');
      }

      await fetchCart();
      alert(`Order Placed Successfully! Your Order Number: ${data.orderNumber}`);
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      <button onClick={() => navigate('/cart')} className="glass-btn glass-btn-secondary" style={{ marginBottom: '30px', borderRadius: '20px' }}>
        <ArrowLeft size={16} /> Return to Cart
      </button>

      <form onSubmit={handleSubmit} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        alignItems: 'flex-start'
      }}>
        
        {/* Addresses & Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Shipping Section */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={22} className="text-primary" /> Delivery Information
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Recipient Name *</label>
                <input type="text" className="glass-input" value={shippingName} onChange={(e) => setShippingName(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Mobile Phone *</label>
                  <input type="text" placeholder="e.g. 0771234567" className="glass-input" value={shippingPhone} onChange={(e) => setShippingPhone(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Country *</label>
                  <select className="glass-input" value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)}>
                    <option value="Sri Lanka">Sri Lanka</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Street Address *</label>
                <input type="text" placeholder="House No, Street name" className="glass-input" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Postal Code (5 digits) *</label>
                <input type="text" placeholder="e.g. 10000" className="glass-input" value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value)} required />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                Save this address in my profiles directory
              </label>
            </div>
          </div>

          {/* Billing Section */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Billing Address</h2>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
              <input type="checkbox" checked={sameAsShipping} onChange={(e) => setSameAsShipping(e.target.checked)} />
              Billing address is the same as shipping address
            </label>

            {!sameAsShipping && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Billing Recipient *</label>
                  <input type="text" className="glass-input" value={billingName} onChange={(e) => setBillingName(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600' }}>Billing Phone *</label>
                    <input type="text" placeholder="e.g. 0771234567" className="glass-input" value={billingPhone} onChange={(e) => setBillingPhone(e.target.value)} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600' }}>Country *</label>
                    <select className="glass-input" value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)}>
                      <option value="Sri Lanka">Sri Lanka</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Billing Street Address *</label>
                  <input type="text" className="glass-input" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Billing Postal Code *</label>
                  <input type="text" className="glass-input" value={billingPostalCode} onChange={(e) => setBillingPostalCode(e.target.value)} required />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Loyalty point rewards */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={20} className="text-warning" /> Loyalty Point Discounts
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              You have <strong>{availablePoints}</strong> loyalty points available. You can redeem points to get an instant discount (1 point = Rs. 1.00).
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
              <input
                type="number"
                min="0"
                max={Math.min(availablePoints, Math.floor(subtotal))}
                className="glass-input"
                style={{ width: '120px' }}
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>points to redeem</span>
            </div>
          </div>

          {/* Payment Section */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={20} className="text-secondary" /> Payment Method
            </h3>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '16px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              border: '1px solid var(--primary)',
              cursor: 'pointer'
            }}>
              <input type="radio" checked readOnly />
              <div>
                <strong style={{ display: 'block', fontSize: '14px' }}>Credit / Debit Card</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Visa, MasterCard, Amex</span>
              </div>
            </label>
          </div>

          {/* Order Summary & Final Total */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Review & Place Order</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justify: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cart Subtotal</span>
                <span>Rs. {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              {loyaltyDiscount > 0 && (
                <div style={{ display: 'flex', justify: 'space-between', color: 'var(--success)' }}>
                  <span>Loyalty Discount ({redeemPoints} pts)</span>
                  <span>- Rs. {loyaltyDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

              <div style={{ display: 'flex', justify: 'space-between', fontSize: '18px', fontWeight: '800' }}>
                <span>Final Amount</span>
                <span className="text-primary">Rs. {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: '14px', background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px' }}>{error}</div>}

            <button
              type="submit"
              disabled={loading || cartItems.length === 0}
              className="glass-btn"
              style={{ width: '100%', borderRadius: '12px', fontSize: '16px' }}
            >
              {loading ? 'Processing Transaction...' : 'Authorize Payment & Place Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
