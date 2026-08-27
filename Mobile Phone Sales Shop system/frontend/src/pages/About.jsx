import React from 'react';
import { ShieldCheck, Truck, Crown, Info, Sparkles, CheckCircle2 } from 'lucide-react';

export default function About() {
  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Title Bar Banner */}
      <div className="glass-panel p-4 p-md-5 mb-5 rounded-4" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(99, 102, 241, 0.2) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <h2 className="fw-bold text-white mb-2 d-flex align-items-center gap-3 fs-2">
          <Info size={32} className="text-primary-light" /> About Us
        </h2>
        <p className="text-slate-300 mb-0 fs-6">
          Learn more about Mobile Mart, our mission, and our dedication to providing quality mobile devices.
        </p>
      </div>

      {/* Story & Why Choose Us Grid */}
      <div className="row g-4 align-items-stretch">
        
        {/* Left Column: Our Story & Mission */}
        <div className="col-lg-6">
          <div className="glass-panel p-4 p-md-5 h-100 rounded-4 d-flex flex-column justify-content-between">
            <div>
              <h3 className="fw-bold text-white mb-4 d-flex align-items-center gap-2 fs-3">
                <Sparkles size={24} className="text-primary-light" /> Our Story & Mission
              </h3>
              <p className="text-slate-200 mb-4 fs-6" style={{ lineHeight: '1.85' }}>
                Founded in 2026, <strong className="text-white">Mobile Mart</strong> was established with a singular vision: to make the latest mobile technologies accessible, affordable, and transparent for everyone. We believe that a smartphone is more than just a gadget—it is an essential gateway to communication, work, learning, and self-expression.
              </p>
              <p className="text-slate-300 mb-4 fs-6" style={{ lineHeight: '1.85' }}>
                We bridge the gap between premium brands and smart buyers. By curating a catalog of verified high-performance devices from top global manufacturers, we guarantee authenticity, official warranty support, and stellar customer service with every checkout.
              </p>
            </div>

            <div className="p-3.5 rounded-3" style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
              <div className="d-flex align-items-center gap-2 text-primary-light fw-bold mb-1 fs-6">
                <CheckCircle2 size={18} /> Verified Quality Assurance
              </div>
              <p className="text-slate-300 mb-0" style={{ fontSize: '13.5px' }}>
                Every device in our inventory undergoes rigorous quality verification before listing.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Why Choose Us Cards */}
        <div className="col-lg-6">
          <div className="glass-panel p-4 p-md-5 h-100 rounded-4">
            <h3 className="fw-bold text-white mb-4 fs-3">Why Choose Us?</h3>
            
            <div className="d-flex align-items-start mb-4 p-3 rounded-3" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="p-3 rounded-circle me-3 flex-shrink-0" style={{ background: 'rgba(99, 102, 241, 0.18)', color: '#818cf8' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h5 className="fw-bold text-white mb-1 fs-6">100% Genuine Products</h5>
                <p className="text-slate-300 mb-0" style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
                  We work directly with official manufacturer representatives to deliver authentic smartphones and accessories with official warranties.
                </p>
              </div>
            </div>

            <div className="d-flex align-items-start mb-4 p-3 rounded-3" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="p-3 rounded-circle me-3 flex-shrink-0" style={{ background: 'rgba(6, 182, 212, 0.18)', color: '#22d3ee' }}>
                <Truck size={24} />
              </div>
              <div>
                <h5 className="fw-bold text-white mb-1 fs-6">Swift & Secure Delivery</h5>
                <p className="text-slate-300 mb-0" style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
                  Your package is handled with care and shipped securely using our trusted delivery partners straight to your doorstep.
                </p>
              </div>
            </div>

            <div className="d-flex align-items-start p-3 rounded-3" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="p-3 rounded-circle me-3 flex-shrink-0" style={{ background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24' }}>
                <Crown size={24} />
              </div>
              <div>
                <h5 className="fw-bold text-white mb-1 fs-6">Exclusive Loyalty Perks</h5>
                <p className="text-slate-300 mb-0" style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
                  We believe in rewarding our community. Earn 1 loyalty point for every Rs. 100 spent and unlock exclusive discounts.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
