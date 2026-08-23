import React from 'react';
import { Shield, Truck, Award, Info } from 'lucide-react';

export default function About() {
  return (
    <div className="container animate-fade-in text-center" style={{ paddingBottom: '60px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* Title Bar */}
      <div className="glass-panel" style={{
        padding: '40px',
        textAlign: 'left',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Info size={32} className="text-primary" /> About Us
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
          Learn more about Antigravity Phones, our mission, and our dedication to premium mobile technology.
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        alignItems: 'center',
        textAlign: 'left'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>Our Story & Mission</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.8', marginBottom: '15px' }}>
            Founded in 2026, <strong>Antigravity Phones</strong> was established with a singular vision: to make the latest mobile technologies accessible, affordable, and transparent for everyone. We believe that a smartphone is more than just a gadget—it is an essential gateway to communication, work, learning, and self-expression.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.8' }}>
            We bridge the gap between premium brands and smart buyers. By curating a catalog of verified high-performance devices from top global manufacturers, we guarantee authenticity, warranty support, and stellar customer service with every checkout.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>Why Choose Us?</h3>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '50%', color: 'var(--primary)' }}>
              <Shield size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700' }}>100% Genuine Products</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                We work directly with manufacturer representatives to deliver authentic smartphones and accessories with official warranties.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '10px', borderRadius: '50%', color: 'var(--secondary)' }}>
              <Truck size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Swift & Secure Delivery</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Your package is handled with care and shipped securely using our trusted delivery partners straight to your doorstep.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '50%', color: 'var(--success)' }}>
              <Award size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Exclusive Loyalty Perks</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                We believe in rewarding our community. Earn points on every purchase and redeem points to unlock exclusive store benefits.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
