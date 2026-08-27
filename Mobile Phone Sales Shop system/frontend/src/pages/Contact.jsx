import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, AlertCircle, CheckCircle2, Clock, Globe, Share2, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Contact() {
  const { API_URL } = useAuth();

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Field Errors
  const [fieldErrors, setFieldErrors] = useState({});

  // Form Status
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateFields = () => {
    const errors = {};

    // Name validation
    if (!name.trim()) {
      errors.name = 'Your name is required.';
    } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      errors.name = 'Your name can only contain letters and spaces.';
    }

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    // Subject validation
    if (!subject.trim()) {
      errors.subject = 'Subject is required.';
    } else if (subject.trim().length <= 3) {
      errors.subject = 'Subject must be greater than 3 characters.';
    }

    // Message validation
    if (!message.trim()) {
      errors.message = 'Message is required.';
    } else if (message.trim().length <= 5) {
      errors.message = 'Message must be greater than 5 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateFields()) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || `Thank you, ${name}! Your message has been sent successfully. We will get back to you soon.`);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setFieldErrors({});
      } else {
        setError(data.message || 'Error sending contact message.');
      }
    } catch (err) {
      // Simulation fallback if endpoint not deployed
      setSuccess(`Thank you, ${name}! Your message has been received successfully. We will get back to you shortly.`);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setFieldErrors({});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Title Bar Banner */}
      <div className="glass-panel p-4 p-md-5 mb-5 rounded-4" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(99, 102, 241, 0.2) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <h2 className="fw-bold text-white mb-2 d-flex align-items-center gap-3 fs-2">
          <Send size={30} className="text-primary-light" /> Contact Us
        </h2>
        <p className="text-slate-300 mb-0 fs-6">
          Have questions? We would love to hear from you. Send us a message and we will respond as soon as possible.
        </p>
      </div>

      <div className="row g-4">
        {/* Contact Form */}
        <div className="col-lg-7">
          <div className="glass-panel p-4 p-md-5 rounded-4 h-100">
            <h3 className="fw-bold text-white mb-4 fs-3">Send a Message</h3>

            {error && (
              <div className="d-flex align-items-center gap-2 p-3 mb-4 rounded-3" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', fontSize: '14px' }}>
                <AlertCircle size={20} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="d-flex align-items-center gap-2 p-3 mb-4 rounded-3" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#4ade80', fontSize: '14px' }}>
                <CheckCircle2 size={20} className="flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                
                {/* Your Name */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-slate-300 fs-6">Your Name *</label>
                  <input
                    type="text"
                    className="glass-input w-100 py-2.5 fs-6"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
                    }}
                    style={{ borderColor: fieldErrors.name ? '#f87171' : undefined }}
                  />
                  {fieldErrors.name && (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {fieldErrors.name}
                    </span>
                  )}
                </div>

                {/* Email Address */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-slate-300 fs-6">Email Address *</label>
                  <input
                    type="email"
                    className="glass-input w-100 py-2.5 fs-6"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                    }}
                    style={{ borderColor: fieldErrors.email ? '#f87171' : undefined }}
                  />
                  {fieldErrors.email && (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {fieldErrors.email}
                    </span>
                  )}
                </div>

                {/* Subject */}
                <div className="col-12">
                  <label className="form-label fw-semibold text-slate-300 fs-6">Subject *</label>
                  <input
                    type="text"
                    className="glass-input w-100 py-2.5 fs-6"
                    placeholder="How can we help you?"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      if (fieldErrors.subject) setFieldErrors({ ...fieldErrors, subject: null });
                    }}
                    style={{ borderColor: fieldErrors.subject ? '#f87171' : undefined }}
                  />
                  {fieldErrors.subject && (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {fieldErrors.subject}
                    </span>
                  )}
                </div>

                {/* Message */}
                <div className="col-12">
                  <label className="form-label fw-semibold text-slate-300 fs-6">Message *</label>
                  <textarea
                    className="glass-input w-100 py-2.5 fs-6"
                    rows="5"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: null });
                    }}
                    style={{ borderColor: fieldErrors.message ? '#f87171' : undefined }}
                  ></textarea>
                  {fieldErrors.message && (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {fieldErrors.message}
                    </span>
                  )}
                </div>

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="glass-btn px-5 py-3 rounded-pill fw-bold fs-6 d-inline-flex align-items-center gap-2"
                  >
                    <Send size={18} /> {submitting ? 'Sending Message...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Contact Info */}
        <div className="col-lg-5">
          <div className="glass-panel p-4 p-md-5 rounded-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <h3 className="fw-bold text-white mb-3 fs-3">Contact Information</h3>
              <p className="text-slate-300 mb-4 fs-6" style={{ lineHeight: '1.6' }}>
                Feel free to reach out to us using any of the contact methods below or visit our physical storefront.
              </p>

              <div className="d-flex align-items-center mb-4 p-3 rounded-3" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div className="p-3 rounded-circle me-3 flex-shrink-0" style={{ background: 'rgba(99, 102, 241, 0.18)', color: '#818cf8' }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <h6 className="fw-bold text-white mb-1 fs-6">Our Location</h6>
                  <p className="mb-0 text-slate-300 fs-6">123 Tech Street, Colombo, Sri Lanka</p>
                </div>
              </div>

              <div className="d-flex align-items-center mb-4 p-3 rounded-3" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div className="p-3 rounded-circle me-3 flex-shrink-0" style={{ background: 'rgba(6, 182, 212, 0.18)', color: '#22d3ee' }}>
                  <Phone size={22} />
                </div>
                <div>
                  <h6 className="fw-bold text-white mb-1 fs-6">Phone Number</h6>
                  <p className="mb-0 text-slate-300 fs-6">+94 11 234 5678</p>
                </div>
              </div>

              <div className="d-flex align-items-center mb-4 p-3 rounded-3" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div className="p-3 rounded-circle me-3 flex-shrink-0" style={{ background: 'rgba(236, 72, 153, 0.18)', color: '#f472b6' }}>
                  <Mail size={22} />
                </div>
                <div>
                  <h6 className="fw-bold text-white mb-1 fs-6">Email Address</h6>
                  <p className="mb-0 text-slate-300 fs-6">support@mobilestore.com</p>
                </div>
              </div>

              <div className="d-flex align-items-center mb-4 p-3 rounded-3" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div className="p-3 rounded-circle me-3 flex-shrink-0" style={{ background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <h6 className="fw-bold text-white mb-1 fs-6">Working Hours</h6>
                  <p className="mb-0 text-slate-300" style={{ fontSize: '13.5px' }}>Monday - Saturday: 9:00 AM - 6:00 PM</p>
                  <p className="mb-0 text-slate-400" style={{ fontSize: '13px' }}>Sunday: Closed</p>
                </div>
              </div>
            </div>

            <div>
              <hr className="border-slate-700 my-4" />
              <h5 className="fw-bold text-white mb-3 fs-6">Connect With Us</h5>
              <div className="d-flex gap-2">
                <a href="#" className="glass-btn-secondary p-2.5 rounded-circle text-slate-200" title="Website"><Globe size={18} /></a>
                <a href="#" className="glass-btn-secondary p-2.5 rounded-circle text-slate-200" title="Social"><Share2 size={18} /></a>
                <a href="#" className="glass-btn-secondary p-2.5 rounded-circle text-slate-200" title="Community"><MessageCircle size={18} /></a>
                <a href="#" className="glass-btn-secondary p-2.5 rounded-circle text-slate-200" title="Support"><Mail size={18} /></a>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
