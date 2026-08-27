import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ChevronRight, Store, Package, User, Info, FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass-panel" style={{
      marginTop: '60px',
      borderRadius: '24px 24px 0 0',
      borderBottom: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(16px)',
      padding: '50px 0 24px 0',
      boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.4)'
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '40px',
        marginBottom: '40px'
      }}>
        {/* Brand & About */}
        <div>
          <h4 style={{
            fontSize: '22px',
            fontWeight: '800',
            marginBottom: '16px',
            background: 'linear-gradient(90deg, #ec4899, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px'
          }}>MobileMart</h4>
          <p className="text-slate-300" style={{ fontSize: '14px', lineHeight: '1.65' }}>
            Your trusted destination for genuine smartphones, tablets, accessories, and expert repair services. Delivering tech excellence straight to your doorstep.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h5 className="text-white" style={{ fontSize: '16px', fontWeight: '700', marginBottom: '18px' }}>Quick Links</h5>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
            <li>
              <Link to="/" className="text-slate-300 hover:text-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: 'var(--transition)' }}>
                <ChevronRight size={14} className="text-primary-light" /> Shop Home
              </Link>
            </li>
            <li>
              <Link to="/products" className="text-slate-300 hover:text-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: 'var(--transition)' }}>
                <ChevronRight size={14} className="text-primary-light" /> Browse Catalog
              </Link>
            </li>
            <li>
              <Link to="/profile" className="text-slate-300 hover:text-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: 'var(--transition)' }}>
                <ChevronRight size={14} className="text-primary-light" /> My Account
              </Link>
            </li>
            <li>
              <Link to="/my-orders" className="text-slate-300 hover:text-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: 'var(--transition)' }}>
                <ChevronRight size={14} className="text-primary-light" /> My Orders
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care / Company */}
        <div>
          <h5 className="text-white" style={{ fontSize: '16px', fontWeight: '700', marginBottom: '18px' }}>Customer Care</h5>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
            <li>
              <Link to="/about" className="text-slate-300 hover:text-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: 'var(--transition)' }}>
                <ChevronRight size={14} className="text-primary-light" /> About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-slate-300 hover:text-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: 'var(--transition)' }}>
                <ChevronRight size={14} className="text-primary-light" /> Contact Us
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-slate-300 hover:text-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: 'var(--transition)' }}>
                <ChevronRight size={14} className="text-primary-light" /> Terms & Conditions
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h5 className="text-white" style={{ fontSize: '16px', fontWeight: '700', marginBottom: '18px' }}>Contact Info</h5>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }} className="text-slate-300">
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <MapPin size={18} className="text-primary-light flex-shrink-0" style={{ marginTop: '2px' }} />
              <span>123 Tech Street, Colombo, Sri Lanka</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={18} className="text-primary-light flex-shrink-0" />
              <span>+94 11 234 5678</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={18} className="text-primary-light flex-shrink-0" />
              <span>support@mobilestore.com</span>
            </li>
          </ul>
        </div>

      </div>

      <hr style={{ border: '0', borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '20px' }} />

      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        fontSize: '13.5px'
      }} className="text-slate-400">
        <span>&copy; {new Date().getFullYear()} MobileMart. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/about" className="text-slate-400 hover:text-white" style={{ textDecoration: 'none' }}>About</Link>
          <Link to="/contact" className="text-slate-400 hover:text-white" style={{ textDecoration: 'none' }}>Contact</Link>
          <Link to="/terms" className="text-slate-400 hover:text-white" style={{ textDecoration: 'none' }}>Terms & Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
