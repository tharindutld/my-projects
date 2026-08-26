import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ConfirmModal from '../components/ConfirmModal';

export default function Cart() {
  const {
    cartItems,
    updateCartQty,
    removeFromCart,
    getCartSubtotal,
    getCartOriginalSubtotal,
    getCartSavings
  } = useCart();
  const navigate = useNavigate();

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Remove',
    variant: 'danger',
    onConfirm: null
  });

  const handleQtyChange = async (orderId, currentQty, stock, direction) => {
    const newQty = direction === 'inc' ? currentQty + 1 : currentQty - 1;
    if (newQty < 1) return;
    if (newQty > stock) return;
    try {
      await updateCartQty(orderId, newQty);
    } catch (err) {
      alert(err.message);
    }
  };

  const requestRemoveFromCart = (item) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Item from Cart',
      message: `Are you sure you want to remove "${item.ProductName}" (${item.Color || 'Standard'}, ${item.ROM || ''}) from your shopping cart?`,
      confirmText: 'Remove Item',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await removeFromCart(item.OrderID);
        } catch (err) {
          alert(err.message || 'Error removing item from cart');
        }
      }
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="container animate-fade-in" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🛒</div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '10px' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="glass-btn" style={{ borderRadius: '24px' }}>
          Explore Catalog <ShoppingBag size={18} />
        </Link>
      </div>
    );
  }

  const subtotal = getCartSubtotal();
  const originalSubtotal = getCartOriginalSubtotal();
  const savings = getCartSavings();

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '30px' }}>Shopping Cart</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        alignItems: 'flex-start'
      }}>
        {/* Cart items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {cartItems.map((item) => (
            <div key={item.OrderID} className="glass-card" style={{
              display: 'flex',
              padding: '20px',
              gap: '20px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ fontSize: '40px' }}>📱</div>
              
              <div style={{ flexGrow: 1, minWidth: '200px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                  {item.BrandName}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{item.ProductName}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Color: {item.Color} | Config: {item.ROM} / {item.RAM}
                </p>
                {item.DiscountPercent > 0 && (
                  <span className="badge bg-warning bg-opacity-20 text-dark border border-warning" style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '5px'
                  }}>
                    {item.DiscountPercent}% OFF applied
                  </span>
                )}
              </div>

              {/* Qty adjustments */}
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                <button
                  onClick={() => handleQtyChange(item.OrderID, item.Quantity, item.Stock, 'dec')}
                  style={{ background: 'none', border: 'none', color: '#fff', width: '30px', height: '30px', cursor: 'pointer' }}
                >
                  -
                </button>
                <span style={{ width: '35px', textAlign: 'center', fontSize: '14px' }}>{item.Quantity}</span>
                <button
                  onClick={() => handleQtyChange(item.OrderID, item.Quantity, item.Stock, 'inc')}
                  style={{ background: 'none', border: 'none', color: '#fff', width: '30px', height: '30px', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>

              {/* Prices */}
              <div style={{ textAlign: 'right', minWidth: '120px' }}>
                <div style={{ fontWeight: '700', fontSize: '16px' }}>
                  Rs. {(item.discountedPrice * item.Quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                {item.DiscountPercent > 0 && (
                  <div style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Rs. {(item.price * item.Quantity).toLocaleString('en-US')}
                  </div>
                )}
              </div>

              {/* Remove */}
              <button
                onClick={() => requestRemoveFromCart(item)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'var(--danger)',
                  padding: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                title="Remove Item from Cart"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Order Summary</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Items Subtotal</span>
              <span>Rs. {originalSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            
            {savings > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>Promotional Savings</span>
                <span>- Rs. {savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800' }}>
              <span>Total Price</span>
              <span>Rs. {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            * Loyalty point rewards: You will earn approximately <strong>{Math.floor(subtotal / 1000)} points</strong> on this order.
          </div>

          <button onClick={() => navigate('/checkout')} className="glass-btn" style={{ width: '100%', borderRadius: '12px', marginTop: '10px' }}>
            Proceed to Checkout <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
