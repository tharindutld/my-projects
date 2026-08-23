import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Lock, Unlock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

export default function AdminUsers() {
  const { token, user, API_URL } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const LIMIT = 15;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.append('search', search);
      const res = await fetch(`${API_URL}/staff/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalRows(data.totalRows || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, token, API_URL]);

  useEffect(() => {
    if (!token || !user || user.role === 'Customer') {
      navigate('/login?staff=true');
      return;
    }
    loadUsers();
  }, [loadUsers]);

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setActionLoading(userId);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/staff/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Failed to update status.');
        return;
      }
      setSuccessMsg(`User account ${newStatus === 'Active' ? 'activated' : 'locked'} successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadUsers();
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  return (
    <AdminLayout>
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={28} style={{ color: 'var(--primary)' }} /> Registered Customers
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Manage customer accounts, lock/unlock access, and view loyalty points.
          </p>
        </div>
        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', padding: '10px 16px', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Total Registered: </span>
          <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{totalRows}</span>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--success)', borderRadius: '10px', padding: '12px 16px', color: 'var(--success)', marginBottom: '20px', fontSize: '14px' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '10px', padding: '12px 16px', color: 'var(--danger)', marginBottom: '20px', fontSize: '14px' }}>
          {errorMsg}
        </div>
      )}

      {/* Search */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <input
              type="text"
              placeholder="Search by name, email, or mobile number..."
              className="glass-input"
              style={{ width: '100%', paddingLeft: '40px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
          </div>
          <button type="submit" className="glass-btn" style={{ borderRadius: '8px' }}>Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); }} className="glass-btn glass-btn-secondary" style={{ borderRadius: '8px' }}>
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['#', 'Customer Name', 'Email', 'Mobile', 'Loyalty Points', 'Registered', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading customers...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No customers found.</td></tr>
              ) : users.map((u, idx) => (
                <tr key={u.ID} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{(page - 1) * LIMIT + idx + 1}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '600' }}>{u.FirstName} {u.LastName}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{u.Email}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px' }}>{u.MobileNumber}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--primary)' }}>{u.LoyaltyPoints || 0}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {u.CreationDate ? new Date(u.CreationDate).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: u.Status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: u.Status === 'Active' ? 'var(--success)' : 'var(--danger)',
                      borderRadius: '20px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      {u.Status || 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => toggleStatus(u.ID, u.Status || 'Active')}
                      disabled={actionLoading === u.ID}
                      className="glass-btn glass-btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: u.Status === 'Active' ? 'var(--danger)' : 'var(--success)' }}
                    >
                      {u.Status === 'Active' ? <><Lock size={13} /> Lock</> : <><Unlock size={13} /> Unlock</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="glass-btn glass-btn-secondary" style={{ padding: '8px 14px', borderRadius: '8px' }}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2).map((p, i, arr) => (
              <React.Fragment key={p}>
                {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: 'var(--text-muted)' }}>...</span>}
                <button
                  onClick={() => setPage(p)}
                  className={`glass-btn ${page === p ? '' : 'glass-btn-secondary'}`}
                  style={{ padding: '8px 14px', borderRadius: '8px', minWidth: '38px' }}
                >{p}</button>
              </React.Fragment>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="glass-btn glass-btn-secondary" style={{ padding: '8px 14px', borderRadius: '8px' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}
