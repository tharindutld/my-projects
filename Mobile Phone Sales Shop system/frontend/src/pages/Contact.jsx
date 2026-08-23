import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Contact() {
  const { API_URL } = useAuth();

  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Status
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Pre-validations
    if (!name || !email || !subject || !message) {
      setError('All fields are required. Please fill in all fields.');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      setError('Your name can only contain letters and spaces (no numbers or special characters).');
      return;
    }

    if (subject.length <= 3) {
      setError('Subject must be greater than 3 characters.');
      return;
    }

    if (message.length <= 5) {
      setError('Message must be greater than 5 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, subject, message })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Communication with the server failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Title block */}
      <div className="glass-panel" style={{
        padding: '40px',
        marginBottom: '40px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.1) 100%)'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Mail size={32} className="text-secondary" /> Contact Us
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
          Have questions? We would love to hear from you. Send us a message and we will respond as soon as possible.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        alignItems: 'flex-start'
      }}>
        {/* Contact Form */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Send a Message</h2>

          {error && (
            <div style={{
              display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--danger)',
              fontSize: '13px', background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '15px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--success)',
              fontSize: '13px', background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '15px'
            }}>
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Your Name *</label>
                <input type="text" className="glass-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Email Address *</label>
                <input type="email" className="glass-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Subject *</label>
              <input type="text" className="glass-input" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Message *</label>
              <textarea className="glass-input" style={{ minHeight: '120px', resize: 'vertical' }} value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>

            <button type="submit" disabled={submitting} className="glass-btn" style={{ borderRadius: '8px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Send size={14} /> {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Contact Info Card */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Contact Information</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            Feel free to reach out to us using any of the contact methods below or visit our brick-and-mortar storefront.
          </p>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(99,102,241,0.15)', padding: '10px', borderRadius: '50%', color: 'var(--primary)' }}>
              <MapPin size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block' }}>Our Location</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>123 Tech Street, Colombo, Sri Lanka</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(6,182,212,0.15)', padding: '10px', borderRadius: '50%', color: 'var(--secondary)' }}>
              <Phone size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block' }}>Phone Number</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>+94 11 234 5678</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(236,72,153,0.15)', padding: '10px', borderRadius: '50%', color: 'var(--accent)' }}>
              <Mail size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block' }}>Email Address</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>support@mobilestore.com</span>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

          <div>
            <strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Working Hours</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>Monday - Saturday: 9:00 AM - 6:00 PM</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>Sunday: Closed</span>
          </div>
        </div>
      </div>

    </div>
  );
}
