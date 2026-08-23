import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, Phone, Lock, ArrowLeft, ShieldAlert, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LostPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { API_URL } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const isStaffPortal = searchParams.get('staff') === 'true';

  // Fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !phone || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    const minLength = isStaffPortal ? 6 : 8;
    if (newPassword.length < minLength) {
      setError(`Password must be at least ${minLength} characters long.`);
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = isStaffPortal ? 'recover/staff' : 'recover/customer';
      const res = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, phone, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setEmail('');
        setPhone('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to reach password recovery system.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      padding: '40px 20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '40px 30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Reset Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '5px' }}>
            {isStaffPortal ? 'Staff Account Recovery' : 'Customer Account Recovery'}
          </p>
        </div>

        {/* Content */}
        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
            <div style={{
              display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--success)',
              fontSize: '14px', background: 'rgba(16,185,129,0.1)', padding: '15px', borderRadius: '8px'
            }}>
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
            <Link to={isStaffPortal ? '/login?staff=true' : '/login'} className="glass-btn" style={{ width: '100%', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder={isStaffPortal ? 'admin@store.com' : 'customer@gmail.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Registered Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="e.g. 0719108628"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {error && (
              <div style={{
                color: 'var(--danger)',
                fontSize: '13px',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldAlert size={16} />
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="glass-btn" style={{ width: '100%', borderRadius: '8px' }}>
              {submitting ? 'Resetting...' : 'Reset Password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <Link to={isStaffPortal ? '/login?staff=true' : '/login'} style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
