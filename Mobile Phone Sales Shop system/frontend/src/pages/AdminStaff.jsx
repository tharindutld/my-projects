import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Shield, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminStaff() {
  const { token, API_URL } = useAuth();
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
    if (!token) {
      navigate('/login?staff=true');
      return;
    }
    loadAccounts();
  }, [token]);

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Input validations
    if (!firstName || !lastName || !email || !phone || !password || !role) {
      setError('Please fill in all staff details.');
      return;
    }

    if (!/^0[0-9]{9}$/.test(phone)) {
      setError('Phone number must be exactly 10 digits starting with 0.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/staff/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
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
        loadAccounts();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Staff registration failed.');
    }
  };

  const handleToggleCustomerLock = async (customerId, currentStatus) => {
    const nextStatus = currentStatus === 1 ? 0 : 1;
    const actionLabel = nextStatus === 0 ? 'lock / disable' : 'unlock / active';
    if (!window.confirm(`Are you sure you want to ${actionLabel} this customer's account?`)) return;

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
        alert(data.message);
        loadAccounts();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('WARNING: Are you sure you want to delete this staff user? This action is irreversible.')) return;
    try {
      const res = await fetch(`${API_URL}/staff/${staffId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Staff account deleted.');
        loadAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
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

          <form onSubmit={handleRegisterStaff} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>First Name</label>
                <input type="text" className="glass-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Last Name</label>
                <input type="text" className="glass-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Email Address</label>
              <input type="email" className="glass-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Mobile Phone</label>
              <input type="text" placeholder="e.g. 0771234567" className="glass-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Password</label>
              <input type="password" className="glass-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>System Role Permissions</label>
              <select className="glass-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Sales person">Sales person</option>
                <option value="Technician">Technician</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: '13px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '6px' }}>{error}</div>}
            {success && <div style={{ color: 'var(--success)', fontSize: '13px', background: 'rgba(16,185,129,0.1)', padding: '10px', borderRadius: '6px' }}>{success}</div>}

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
  );
}
