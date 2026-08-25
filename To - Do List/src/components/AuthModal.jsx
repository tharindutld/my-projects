import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Phone, Zap, LogOut, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, user, onLogin, onRegister, onLogout, onDemoLogin }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('⚡');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', phone: '', password: '' });

  useEffect(() => {
    setShowLogoutConfirm(false);
    setErrorMsg('');
    setFieldErrors({ name: '', email: '', phone: '', password: '' });
  }, [isOpen, user]);

  if (!isOpen) return null;

  const AVATARS = ['⚡', '🚀', '🎯', '🔥', '💻', '🎨', '🌟', '🧠'];

  const validateName = (val) => {
    if (!val.trim()) return 'Full name is required.';
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(val.trim())) {
      return 'Name cannot include numbers, special characters, decimals, minus or plus.';
    }
    return '';
  };

  const validatePhone = (val) => {
    if (!val.trim()) return 'Phone number is required.';
    if (!/^\d+$/.test(val.trim())) {
      return 'Phone number must contain numbers only (no letters or special characters).';
    }
    if (val.trim().length !== 10) {
      return 'Phone number must be exactly 10 digits.';
    }
    return '';
  };

  const validateEmail = (val) => {
    if (!val.trim()) return 'Email address is required.';
    const atCount = (val.match(/@/g) || []).length;
    if (atCount > 1) {
      return 'Email cannot contain multiple @ signs.';
    }
    if (atCount === 0) {
      return 'Email must contain an @ sign.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      return 'Please enter a valid email address in standard format.';
    }
    return '';
  };

  const validatePassword = (val) => {
    if (!val) return 'Password is required.';
    if (val.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (isRegisterMode) {
      setFieldErrors((prev) => ({ ...prev, name: validateName(val) }));
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    if (isRegisterMode) {
      setFieldErrors((prev) => ({ ...prev, phone: validatePhone(val) }));
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setFieldErrors((prev) => ({ ...prev, email: validateEmail(val) }));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setFieldErrors((prev) => ({ ...prev, password: validatePassword(val) }));
  };

  const toggleMode = (register) => {
    setIsRegisterMode(register);
    setErrorMsg('');
    setFieldErrors({ name: '', email: '', phone: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const errors = {};
    if (isRegisterMode) {
      const nameErr = validateName(name);
      if (nameErr) errors.name = nameErr;

      const phoneErr = validatePhone(phone);
      if (phoneErr) errors.phone = phoneErr;
    }

    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    const passErr = validatePassword(password);
    if (passErr) errors.password = passErr;

    setFieldErrors(errors);

    if (Object.values(errors).some((err) => err !== '')) {
      return;
    }

    try {
      if (isRegisterMode) {
        await onRegister(name, email, phone, password, avatar);
      } else {
        await onLogin(email, password);
      }
      onClose();
    } catch (err) {
      if (err.field) {
        setFieldErrors((prev) => ({ ...prev, [err.field]: err.message }));
      } else {
        setErrorMsg(err.message || 'Authentication failed');
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800 }}>
            {showLogoutConfirm
              ? 'Confirm Log Out'
              : user
              ? 'User Profile'
              : isRegisterMode
              ? 'Create Account'
              : 'Sign In'}
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {showLogoutConfirm ? (
          // Logout Confirmation View
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '1.25rem',
                borderRadius: '12px',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem auto'
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Are you sure you want to log out?
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                You are currently signed in as <strong>{user?.name}</strong> ({user?.email}).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, background: '#ef4444', color: 'white', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                  onClose();
                }}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        ) : user ? (
          // Logged In Profile View
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem', width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user.avatar || '⚡'}
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</p>
                {user.phone && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    📱 {user.phone}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--status-completed)', marginTop: '0.3rem' }}>
                  <ShieldCheck size={14} />
                  <span>Authenticated Session</span>
                </div>
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setShowLogoutConfirm(true)}
              style={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          // Login / Register Form
          <form onSubmit={handleSubmit} noValidate>
            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            {isRegisterMode && (
              <>
                {/* Name Field */}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={handleNameChange}
                    style={{ border: fieldErrors.name ? '1px solid #ef4444' : undefined }}
                  />
                  {fieldErrors.name && (
                    <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block', fontWeight: 500 }}>
                      ⚠️ {fieldErrors.name}
                    </span>
                  )}
                </div>

                {/* Phone Field */}
                <div className="form-group">
                  <label className="form-label">Phone Number (10 Digits)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0771234567"
                    maxLength={10}
                    value={phone}
                    onChange={handlePhoneChange}
                    style={{ border: fieldErrors.phone ? '1px solid #ef4444' : undefined }}
                  />
                  {fieldErrors.phone && (
                    <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block', fontWeight: 500 }}>
                      ⚠️ {fieldErrors.phone}
                    </span>
                  )}
                </div>

                {/* Avatar Selection */}
                <div className="form-group">
                  <label className="form-label">Avatar Emoji</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {AVATARS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setAvatar(emoji)}
                        style={{
                          fontSize: '1.25rem',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '8px',
                          background: avatar === emoji ? 'var(--accent-primary)' : 'var(--bg-tertiary)'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="user@example.com"
                value={email}
                onChange={handleEmailChange}
                style={{ border: fieldErrors.email ? '1px solid #ef4444' : undefined }}
              />
              {fieldErrors.email && (
                <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block', fontWeight: 500 }}>
                  ⚠️ {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                style={{ border: fieldErrors.password ? '1px solid #ef4444' : undefined }}
              />
              {fieldErrors.password && (
                <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block', fontWeight: 500 }}>
                  ⚠️ {fieldErrors.password}
                </span>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {isRegisterMode ? 'Create Account' : 'Sign In'}
            </button>

            {/* Quick Demo Login Option */}
            {!isRegisterMode && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { onDemoLogin(); onClose(); }}
                style={{ width: '100%', marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Zap size={16} className="text-amber-400" />
                <span>1-Click Demo Account</span>
              </button>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isRegisterMode ? (
                <span>Already have an account? <button type="button" onClick={() => toggleMode(false)} style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign In</button></span>
              ) : (
                <span>Need an account? <button type="button" onClick={() => toggleMode(true)} style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Register</button></span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
