import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Phone, Zap, LogOut, ShieldCheck, AlertTriangle, Edit3, CheckCircle2, Award, Calendar, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, user, onLogin, onRegister, onLogout, onDemoLogin, taskStats, onUpdateUser }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('⚡');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', phone: '', password: '' });

  const resetFormState = () => {
    setName(user ? user.name || '' : '');
    setEmail('');
    setPhone(user ? user.phone || '' : '');
    setPassword('');
    setAvatar(user ? user.avatar || '⚡' : '⚡');
    setErrorMsg('');
    setSuccessMsg('');
    setRegistrationSuccess(false);
    setRegisteredName('');
    setFieldErrors({ name: '', email: '', phone: '', password: '' });
    setShowLogoutConfirm(false);
    setIsEditingProfile(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetFormState();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleModalClose = () => {
    resetFormState();
    onClose();
  };

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
    if (isRegisterMode || isEditingProfile) {
      setFieldErrors((prev) => ({ ...prev, name: validateName(val) }));
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    if (isRegisterMode || isEditingProfile) {
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
    resetFormState();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const nameErr = validateName(name);
    const phoneErr = validatePhone(phone);
    if (nameErr || phoneErr) {
      setFieldErrors({ name: nameErr, phone: phoneErr });
      return;
    }

    try {
      if (onUpdateUser) {
        await onUpdateUser(name, phone, avatar);
      }
      setSuccessMsg('Profile updated successfully in MySQL!');
      setIsEditingProfile(false);
    } catch (err) {
      if (err.field) {
        setFieldErrors((prev) => ({ ...prev, [err.field]: err.message }));
      } else {
        setErrorMsg(err.message || 'Failed to update profile');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

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
        setRegisteredName(name);
        setRegistrationSuccess(true);
        setTimeout(() => {
          setRegistrationSuccess(false);
          resetFormState();
          onClose();
        }, 2200);
      } else {
        await onLogin(email, password);
        resetFormState();
        onClose();
      }
    } catch (err) {
      if (err.field) {
        setFieldErrors((prev) => ({ ...prev, [err.field]: err.message }));
      } else {
        setErrorMsg(err.message || 'Authentication failed');
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={handleModalClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: user && !showLogoutConfirm ? '520px' : '440px',
          padding: '1.5rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800 }}>
            {registrationSuccess
              ? 'Registration Complete'
              : showLogoutConfirm
              ? 'Confirm Log Out'
              : user
              ? isEditingProfile
                ? 'Edit User Profile'
                : 'User Profile Details'
              : isRegisterMode
              ? 'Create Account'
              : 'Sign In'}
          </h3>
          <button className="btn-icon" onClick={handleModalClose}>
            <X size={18} />
          </button>
        </div>

        {registrationSuccess ? (
          // Successful Account Creation Screen
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.25rem 0', gap: '1rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid var(--status-completed)',
                color: 'var(--status-completed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                🎉 Account Created Successfully!
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Welcome to TaskPulse, <strong>{registeredName}</strong>! Your account has been created and saved directly to the MySQL database.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '0.5rem', minWidth: '160px' }}
              onClick={() => {
                setRegistrationSuccess(false);
                resetFormState();
                onClose();
              }}
            >
              Get Started
            </button>
          </div>
        ) : showLogoutConfirm ? (
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
                  resetFormState();
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
            {successMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                ✅ {successMsg}
              </div>
            )}
            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {isEditingProfile ? (
              // Edit Profile Form
              <form onSubmit={handleSaveProfile} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Avatar Picker */}
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label">Profile Avatar Emoji</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {AVATARS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setAvatar(emoji)}
                        style={{
                          fontSize: '1.3rem',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '8px',
                          border: avatar === emoji ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: avatar === emoji ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                          cursor: 'pointer'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={handleNameChange}
                    style={{ border: fieldErrors.name ? '1px solid #ef4444' : undefined }}
                  />
                  {fieldErrors.name && (
                    <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.2rem', display: 'block', fontWeight: 500 }}>
                      ⚠️ {fieldErrors.name}
                    </span>
                  )}
                </div>

                {/* Phone */}
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label">Phone Number (10 Digits)</label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength={10}
                    value={phone}
                    onChange={handlePhoneChange}
                    style={{ border: fieldErrors.phone ? '1px solid #ef4444' : undefined }}
                  />
                  {fieldErrors.phone && (
                    <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.2rem', display: 'block', fontWeight: 500 }}>
                      ⚠️ {fieldErrors.phone}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setIsEditingProfile(false);
                      setName(user.name || '');
                      setPhone(user.phone || '');
                      setAvatar(user.avatar || '⚡');
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Save Profile Changes
                  </button>
                </div>
              </form>
            ) : (
              // View Profile Summary & Details
              <>
                {/* Header Profile Card */}
                <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.1rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)' }}>
                  <div style={{ fontSize: '2.4rem', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: '2px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {user.avatar || '⚡'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{user.name}</h4>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => setIsEditingProfile(true)}
                        title="Edit Profile"
                        style={{ padding: '0.3rem', color: 'var(--accent-primary)' }}
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                      {user.email}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.8rem', marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>📱 {user.phone || '0771234567'}</span>
                      <span style={{ color: 'var(--status-completed)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <ShieldCheck size={14} /> MySQL Live Session
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Productivity Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '0.65rem', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      {taskStats?.total || 0}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Total Tasks
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '0.65rem', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--status-completed)' }}>
                      {taskStats?.completed || 0}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Done
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '0.65rem', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>
                      {(taskStats?.total || 0) - (taskStats?.completed || 0)}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Pending
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '0.65rem', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ec4899' }}>
                      {taskStats?.completionRate || 0}%
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Rate
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditingProfile(true)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Edit3 size={15} />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowLogoutConfirm(true)}
                    style={{ flex: 1, color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          // Login / Register Form
          <form onSubmit={handleSubmit} noValidate>
            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.55rem 0.8rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            {isRegisterMode && (
              <>
                {/* Name Field */}
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.25rem', fontSize: '0.82rem' }}>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={handleNameChange}
                    style={{ border: fieldErrors.name ? '1px solid #ef4444' : undefined, padding: '0.5rem 0.75rem' }}
                  />
                  {fieldErrors.name && (
                    <span style={{ color: '#ef4444', fontSize: '0.76rem', marginTop: '0.2rem', display: 'block', fontWeight: 500 }}>
                      ⚠️ {fieldErrors.name}
                    </span>
                  )}
                </div>

                {/* Phone Field */}
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.25rem', fontSize: '0.82rem' }}>Phone Number (10 Digits)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0771234567"
                    maxLength={10}
                    value={phone}
                    onChange={handlePhoneChange}
                    style={{ border: fieldErrors.phone ? '1px solid #ef4444' : undefined, padding: '0.5rem 0.75rem' }}
                  />
                  {fieldErrors.phone && (
                    <span style={{ color: '#ef4444', fontSize: '0.76rem', marginTop: '0.2rem', display: 'block', fontWeight: 500 }}>
                      ⚠️ {fieldErrors.phone}
                    </span>
                  )}
                </div>

                {/* Avatar Selection */}
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.25rem', fontSize: '0.82rem' }}>Avatar Emoji</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {AVATARS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setAvatar(emoji)}
                        style={{
                          fontSize: '1.2rem',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '8px',
                          border: avatar === emoji ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: avatar === emoji ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                          cursor: 'pointer'
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
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ marginBottom: '0.25rem', fontSize: '0.82rem' }}>Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="user@example.com"
                value={email}
                onChange={handleEmailChange}
                style={{ border: fieldErrors.email ? '1px solid #ef4444' : undefined, padding: '0.5rem 0.75rem' }}
              />
              {fieldErrors.email && (
                <span style={{ color: '#ef4444', fontSize: '0.76rem', marginTop: '0.2rem', display: 'block', fontWeight: 500 }}>
                  ⚠️ {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ marginBottom: '0.25rem', fontSize: '0.82rem' }}>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                style={{ border: fieldErrors.password ? '1px solid #ef4444' : undefined, padding: '0.5rem 0.75rem' }}
              />
              {fieldErrors.password && (
                <span style={{ color: '#ef4444', fontSize: '0.76rem', marginTop: '0.2rem', display: 'block', fontWeight: 500 }}>
                  ⚠️ {fieldErrors.password}
                </span>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.4rem', padding: '0.65rem' }}>
              {isRegisterMode ? 'Create Account' : 'Sign In'}
            </button>

            {/* Quick Demo Login Option */}
            {!isRegisterMode && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { onDemoLogin(); handleModalClose(); }}
                style={{ width: '100%', marginTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem' }}
              >
                <Zap size={16} className="text-amber-400" />
                <span>1-Click Demo Account</span>
              </button>
            )}

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
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
