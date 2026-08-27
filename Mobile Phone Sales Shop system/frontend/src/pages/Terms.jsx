import React from 'react';
import { FileText, Crown, Shield, CheckCircle2 } from 'lucide-react';

export default function Terms() {
  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Title Bar Banner */}
      <div className="glass-panel p-4 p-md-5 mb-5 rounded-4" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(99, 102, 241, 0.2) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <h2 className="fw-bold text-white mb-2 d-flex align-items-center gap-3 fs-2">
          <FileText size={32} className="text-primary-light" /> Terms & Conditions
        </h2>
        <p className="text-slate-300 mb-0 fs-6">
          Please read our store policies and user agreement carefully before making purchases.
        </p>
      </div>

      {/* Terms Card Container */}
      <div className="glass-panel p-4 p-md-5 rounded-4">
        <p className="text-slate-400 mb-4" style={{ fontSize: '13.5px' }}>
          Last updated: May 24, 2026
        </p>

        <p className="text-slate-200 mb-4 fs-6" style={{ lineHeight: '1.8' }}>
          Welcome to <strong className="text-white">Mobile Mart</strong>. By using our website and purchasing products from us, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
        </p>

        <div className="d-flex flex-column gap-4">
          
          {/* Section 1 */}
          <div className="ps-3 border-start border-3 border-primary">
            <h4 className="fw-bold text-white mb-2 fs-5">1. Introduction & General Agreement</h4>
            <p className="text-slate-300 mb-0 fs-6" style={{ lineHeight: '1.75' }}>
              These terms govern your use of the Mobile Mart storefront, including browsing, account creation, wishlist updates, cart operations, and checkouts. We reserve the right to amend these terms at any time without prior notification.
            </p>
          </div>

          {/* Section 2 */}
          <div className="ps-3 border-start border-3 border-primary">
            <h4 className="fw-bold text-white mb-2 fs-5">2. User Registration & Accounts</h4>
            <p className="text-slate-300 mb-0 fs-6" style={{ lineHeight: '1.75' }}>
              To place orders, you must create a customer account. You are solely responsible for maintaining the confidentiality of your credentials (email and password) and all activities occurring under your account. Registration details must be accurate and valid.
            </p>
          </div>

          {/* Section 3 */}
          <div className="ps-3 border-start border-3 border-primary">
            <h4 className="fw-bold text-white mb-2 fs-5">3. Pricing & Payments</h4>
            <p className="text-slate-300 mb-0 fs-6" style={{ lineHeight: '1.75' }}>
              All prices listed on Mobile Mart are displayed in local currency (Rs.) and are subject to change. Payment can be made using Cash on Delivery (COD) or other options listed during checkout. Orders are subject to verification and approval by our management staff.
            </p>
          </div>

          {/* Section 4: Loyalty Highlight Box */}
          <div className="p-4 rounded-4" style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)'
          }}>
            <h5 className="fw-bold text-warning mb-3 d-flex align-items-center gap-2 fs-5">
              <Crown size={22} /> Customer Loyalty Points Terms
            </h5>
            <p className="text-slate-200 mb-3 fs-6">
              We offer a rewarding Loyalty Points Program for registered customers shopping with Mobile Mart:
            </p>
            <ul className="text-slate-300 mb-0 ps-3 fs-6 d-flex flex-column gap-2" style={{ lineHeight: '1.7' }}>
              <li>
                <strong className="text-white">Point Accumulation:</strong> Customers earn exactly <strong className="text-warning">1 loyalty point for every Rs. 100 spent</strong> on eligible purchases (calculated on the total order amount).
              </li>
              <li>
                <strong className="text-white">Status Requirement:</strong> Points are only credited to your account once your order status is marked as <strong className="text-success">Completed</strong> by our store staff.
              </li>
              <li>
                <strong className="text-white">Reversals and Deductions:</strong> If a completed order is cancelled, returned, or reverted to a "Pending" status, the corresponding points earned from that order will be deducted from your loyalty balance.
              </li>
              <li>
                <strong className="text-white">Checking Balances:</strong> Your cumulative loyalty points balance is visible on your customer dashboard (<strong className="text-white">My Profile</strong> page) and is updated automatically.
              </li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="ps-3 border-start border-3 border-primary">
            <h4 className="fw-bold text-white mb-2 fs-5">5. Shipping & Order Fulfillment</h4>
            <p className="text-slate-300 mb-0 fs-6" style={{ lineHeight: '1.75' }}>
              We offer secure delivery services. Delivery timelines are estimates and are subject to courier handling. Customers are required to provide complete and accurate delivery addresses on their profiles.
            </p>
          </div>

          {/* Section 6 */}
          <div className="ps-3 border-start border-3 border-primary">
            <h4 className="fw-bold text-white mb-2 fs-5">6. Limitation of Liability</h4>
            <p className="text-slate-300 mb-0 fs-6" style={{ lineHeight: '1.75' }}>
              Mobile Mart shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our products or services.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
