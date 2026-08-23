import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';


export default function Footer() {
  return (
    <footer className="glass-panel" style={{
      marginTop: '60px',
      borderRadius: '16px 16px 0 0',
      borderBottom: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      background: 'rgba(15, 23, 42, 0.85)',
      padding: '40px 0 20px 0'
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '40px',
        marginBottom: '40px'
      }}>
        {/* About section */}
        <div>
          <h4 style={{
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '20px',
            background: 'linear-gradient(90deg, #ec4899, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>ANTIGRAVITY PHONES</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            Premium mobile store supplying the latest smartphones, tablets, repairs, and support services. Experience next-generation service.
          </p>
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px', fontSize: '14px', fontWeight: '500' }}>
            <a href="#" style={{ color: 'var(--text-muted)', transition: 'var(--transition)' }}>Facebook</a>
            <a href="#" style={{ color: 'var(--text-muted)', transition: 'var(--transition)' }}>Twitter</a>
            <a href="#" style={{ color: 'var(--text-muted)', transition: 'var(--transition)' }}>Instagram</a>
          </div>
        </div>

        {/* Contact info */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Contact Us</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={16} /> 123 Main Street, Colombo, Sri Lanka
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={16} /> +94 11 234 5678
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={16} /> support@antigravityphones.lk
            </li>
          </ul>
        </div>

        {/* Tech stack */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Architecture & Stack</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            Migrated from legacy PHP to a fully decoupled Node.js Express REST API, React SPA, and clean Glassmorphism CSS styling.
          </p>
        </div>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '20px' }} />

      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        fontSize: '13px',
        color: 'var(--text-muted)'
      }}>
        <span>&copy; {new Date().getFullYear()} Antigravity Phones. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/about" style={{ color: 'var(--text-muted)' }}>About Us</Link>
          <Link to="/contact" style={{ color: 'var(--text-muted)' }}>Contact Us</Link>
          <Link to="/terms" style={{ color: 'var(--text-muted)' }}>Terms & Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
