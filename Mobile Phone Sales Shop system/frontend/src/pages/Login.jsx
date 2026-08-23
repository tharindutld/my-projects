import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Phone, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, staffLogin, register, token, user } = useAuth();

  // Is staff query parameter
  const searchParams = new URLSearchParams(location.search);
  const isStaffPortal = searchParams.get('staff') === 'true';

  // Toggle mode
  const [isRegister, setIsRegister] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration specific fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Status indicators
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user) {
      if (user.role === 'Customer') {
        navigate('/');
      } else {
        navigate('/admin');
      }
    }
  }, [token, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register client
        if (!firstName || !lastName || !email || !mobileNumber || !password) {
          throw new Error('All fields are required.');
        }
        if (!/^0[0-9]{9}$/.test(mobileNumber)) {
          throw new Error('Mobile number must be exactly 10 digits starting with 0.');
        }
        const msg = await register(firstName, lastName, email, mobileNumber, password);
        setSuccess(`${msg} You can now log in.`);
        setIsRegister(false);
        setPassword('');
      } else {
        // Log in
        if (isStaffPortal) {
          const u = await staffLogin(email, password);
          alert(`Welcome back, ${u.first_name}!`);
          navigate('/admin');
        } else {
          const u = await login(email, password);
          alert(`Welcome back, ${u.FirstName}!`);
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <h2 style={{ fontSize: '28px', fontWeight: '800' }}>
            {isRegister
              ? 'Create Customer Account'
              : isStaffPortal
                ? 'Staff Secure Authorization'
                : 'Customer Access'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '5px' }}>
            {isRegister
              ? 'Register to earn loyalty points and save configurations'
              : isStaffPortal
                ? 'Please input credentials assigned by the administrator'
                : 'Enter your credentials to continue shopping'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {isRegister && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>First Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    className="glass-input"
                    style={{ width: '100%', paddingLeft: '40px' }}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Last Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    className="glass-input"
                    style={{ width: '100%', paddingLeft: '40px' }}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="glass-input"
                style={{ width: '100%', paddingLeft: '40px' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {isRegister && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Mobile Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0771234567"
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="glass-input"
                style={{ width: '100%', paddingLeft: '40px' }}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
            </div>
            {!isRegister && (
              <div style={{ textAlign: 'right', marginTop: '4px' }}>
                <Link to={isStaffPortal ? '/lost-password?staff=true' : '/lost-password'} style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
            )}
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

          {success && (
            <div style={{
              color: 'var(--success)',
              fontSize: '13px',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '10px',
              borderRadius: '6px'
            }}>
              {success}
            </div>
          )}

          <button type="submit" disabled={loading} className="glass-btn" style={{ width: '100%', borderRadius: '8px' }}>
            {loading
              ? 'Verifying Security...'
              : isRegister
                ? 'Register Account'
                : 'Authorize Access'}{' '}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer toggles */}
        {!isStaffPortal && (
          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button onClick={() => setIsRegister(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>
                  Log In
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button onClick={() => setIsRegister(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>
                  Register Here
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
