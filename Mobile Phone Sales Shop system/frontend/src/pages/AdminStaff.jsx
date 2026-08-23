import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Shield, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';
import ToastAlert from '../components/ToastAlert';

export default function AdminStaff() {
  const { token, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  // Lists
  const [staffList, setStaffList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields for new staff registration
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Sales person');

  // Status indicators
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const staffRes = await fetch(`${API_URL}/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffList(staffData);
      }

      const custRes = await fetch(`${API_URL}/staff/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomersList(custData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate('/login?staff=true');
      return;
    }
    loadAccounts();
  }, [token, authLoading]);

  const handleRegisterStaffAttempt = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const errors = {};

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!firstName.trim()) {
      errors.firstName = 'First Name is required.';
    } else if (!nameRegex.test(firstName.trim()) || firstName.trim().length < 2 || firstName.trim().length > 50) {
      errors.firstName = 'First name must contain only letters and spaces (2-50 characters).';
    }

    if (!lastName.trim()) {
      errors.lastName = 'Last Name is required.';
    } else if (!nameRegex.test(lastName.trim()) || lastName.trim().length < 2 || lastName.trim().length > 50) {
      errors.lastName = 'Last name must contain only letters and spaces (2-50 characters).';
    }

    if (!email.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!phone.trim()) {
      errors.phone = 'Phone Number is required.';
    } else if (!/^0[0-9]{9}$/.test(phone.trim())) {
      errors.phone = 'Phone number must be exactly 10 digits starting with 0.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (!role) {
      errors.role = 'System role permissions selection is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the highlighted errors in the form.');
      return;
    }

    setFieldErrors({});
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Staff Registration',
      message: `Are you sure you want to register ${firstName} ${lastName} as a ${role}?`,
      onConfirm: executeRegisterStaff
    });
  };

  const executeRegisterStaff = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_URL}/staff/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setFieldErrors({});
        loadAccounts();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Staff registration failed.');
    }
  };

  const handleToggleCustomerLock = (customerId, currentStatus) => {
    const nextStatus = currentStatus === 1 ? 0 : 1;
    const actionLabel = nextStatus === 0 ? 'lock' : 'unlock';

    setConfirmModal({
      isOpen: true,
      title: `${actionLabel.toUpperCase()} Customer Account`,
      message: `Are you sure you want to ${actionLabel} this customer's account?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/staff/customers/${customerId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: nextStatus })
          });

          const data = await res.json();
          if (res.ok) {
            setSuccess(data.message);
            loadAccounts();
          } else {
            setError(data.message);
          }
        } catch (err) {
          setError('Failed to update customer status.');
        }
      }
    });
  };

  const handleDeleteStaff = (staffId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Staff Account',
      message: 'WARNING: Are you sure you want to delete this staff user? This action is irreversible.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/staff/${staffId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setSuccess('Staff account deleted successfully.');
            loadAccounts();
          } else {
            const data = await res.json();
            setError(data.message || 'Failed to delete staff member.');
          }
        } catch (err) {
          setError('Error deleting staff account.');
        }
      }
    });
  };

  return (
    <AdminLayout>
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {error && <ToastAlert type="error" message={error} onClose={() => setError('')} />}
      {success && <ToastAlert type="success" message={success} onClose={() => setSuccess('')} />}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <button onClick={() => navigate('/admin')} className="glass-btn glass-btn-secondary" style={{ borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '30px' }}>
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        alignItems: 'flex-start'
      }}>
        {/* Left column: registers new staff accounts */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserPlus size={22} className="text-primary" /> Register Staff Account
          </h2>

          <form noValidate onSubmit={handleRegisterStaffAttempt} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>First Name <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  className={`glass-input ${fieldErrors.firstName ? 'border-danger' : ''}`} 
                  value={firstName} 
                  onChange={(e) => { setFirstName(e.target.value); setFieldErrors(prev => ({ ...prev, firstName: '' })); }} 
                  placeholder="e.g. Ruwan"
                />
                {fieldErrors.firstName && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.firstName}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Last Name <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  className={`glass-input ${fieldErrors.lastName ? 'border-danger' : ''}`} 
                  value={lastName} 
                  onChange={(e) => { setLastName(e.target.value); setFieldErrors(prev => ({ ...prev, lastName: '' })); }} 
                  placeholder="e.g. Perera"
                />
                {fieldErrors.lastName && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.lastName}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Email Address <span className="text-danger">*</span></label>
              <input 
                type="email" 
                className={`glass-input ${fieldErrors.email ? 'border-danger' : ''}`} 
                value={email} 
                onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: '' })); }} 
                placeholder="staff@store.com"
              />
              {fieldErrors.email && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.email}</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Mobile Phone <span className="text-danger">*</span></label>
              <input 
                type="text" 
                placeholder="e.g. 0771234567" 
                className={`glass-input ${fieldErrors.phone ? 'border-danger' : ''}`} 
                value={phone} 
                onChange={(e) => { setPhone(e.target.value); setFieldErrors(prev => ({ ...prev, phone: '' })); }} 
              />
              {fieldErrors.phone && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.phone}</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Password <span className="text-danger">*</span></label>
              <input 
                type="password" 
                className={`glass-input ${fieldErrors.password ? 'border-danger' : ''}`} 
                value={password} 
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); }} 
                placeholder="At least 8 characters"
              />
              {fieldErrors.password && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.password}</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>System Role Permissions <span className="text-danger">*</span></label>
              <select 
                className={`glass-input ${fieldErrors.role ? 'border-danger' : ''}`} 
                value={role} 
                onChange={(e) => { setRole(e.target.value); setFieldErrors(prev => ({ ...prev, role: '' })); }}
              >
                <option value="Sales person">Sales person</option>
                <option value="Technician">Technician</option>
                <option value="Admin">Admin</option>
              </select>
              {fieldErrors.role && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.role}</div>}
            </div>

            <button type="submit" className="glass-btn" style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }}>
              Add Staff Record
            </button>
          </form>
        </div>

        {/* Right column: Accounts Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Staff Accounts Panel */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} className="text-secondary" /> Staff Directory
            </h2>

            {loading ? (
              <div style={{ color: 'var(--text-muted)' }}>Fetching accounts...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {staffList.map(st => (
                  <div key={st.id} className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '14px' }}>{st.first_name} {st.last_name}</strong>
                      <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)' }}>
                        Role: {st.role} &bull; Email: {st.email}
                      </span>
                    </div>

                    <button onClick={() => handleDeleteStaff(st.id)} className="glass-btn glass-btn-danger" style={{ padding: '6px', borderRadius: '6px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Accounts Directory */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Customer Directory</h2>

            {loading ? (
              <div style={{ color: 'var(--text-muted)' }}>Fetching accounts...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {customersList.map(cust => (
                  <div key={cust.ID} className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '14px' }}>{cust.FirstName} {cust.LastName}</strong>
                      <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)' }}>
                        Points: {cust.LoyaltyPoints} &bull; Email: {cust.Email}
                      </span>
                      <span style={{ fontSize: '11px', color: cust.Status === 1 ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                        Account Status: {cust.Status === 1 ? 'Active' : 'Locked'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleCustomerLock(cust.ID, cust.Status)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: cust.Status === 1 ? 'var(--success)' : 'var(--danger)'
                      }}
                    >
                      {cust.Status === 1 ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
    </AdminLayout>
  );
}
