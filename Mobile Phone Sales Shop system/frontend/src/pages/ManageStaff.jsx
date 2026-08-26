import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Users, UserPlus, Search, Filter, Pencil, Trash2, 
  ChevronLeft, ChevronRight, Eye, X, User, Mail, Phone, Calendar, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ToastAlert from '../components/ToastAlert';
import ConfirmModal from '../components/ConfirmModal';

const getPageNumbers = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
};

export default function ManageStaff() {
  const { token, API_URL, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get('search') || '';
  const roleParam = searchParams.get('role') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Filters & State
  const [searchInput, setSearchInput] = useState(searchParam);
  const [roleFilter, setRoleFilter] = useState(roleParam);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ totalRows: 0, totalPages: 1, page: 1 });

  // Detail Modal State
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Alert & Confirmation
  const [toast, setToast] = useState({ type: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParam) params.append('search', searchParam);
      if (roleParam) params.append('role', roleParam);
      params.append('page', pageParam.toString());
      params.append('limit', '10');

      const res = await fetch(`${API_URL}/staff?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.staff) {
          setStaffList(data.staff);
          setPagination({
            totalRows: data.totalRows || 0,
            totalPages: data.totalPages || 1,
            page: data.page || 1
          });
        } else if (Array.isArray(data)) {
          setStaffList(data);
          setPagination({ totalRows: data.length, totalPages: 1, page: 1 });
        }
      } else {
        setToast({ type: 'error', message: 'Failed to fetch staff directory.' });
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Network or server error.' });
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
    fetchStaff();
  }, [token, authLoading, searchParam, roleParam, pageParam]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    if (searchInput.trim()) newParams.search = searchInput.trim();
    if (roleFilter) newParams.role = roleFilter;
    newParams.page = '1';
    setSearchParams(newParams);
  };

  const handleOpenDetails = (staff) => {
    setSelectedStaff(staff);
    setIsDetailModalOpen(true);
  };

  const handleDeleteStaff = (staffId, staffName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Staff Account',
      message: `WARNING: Are you sure you want to delete ${staffName}? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/staff/${staffId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setToast({ type: 'success', message: 'Staff account deleted successfully.' });
            fetchStaff();
          } else {
            const data = await res.json();
            setToast({ type: 'error', message: data.message || 'Failed to delete staff account.' });
          }
        } catch (err) {
          setToast({ type: 'error', message: 'Error deleting staff account.' });
        }
      }
    });
  };

  return (
    <AdminLayout>
      <div className="container-fluid py-4" style={{ maxWidth: '1200px' }}>
        {toast.message && (
          <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Top Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#818cf8',
              background: 'rgba(99,102,241,0.15)',
              padding: '4px 12px',
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '8px'
            }}>System Management</span>
            <h2 className="text-white fw-bold m-0 d-flex align-items-center gap-2">
              <Users className="text-primary" /> Staff Management
            </h2>
          </div>

          <Link to="/admin/add-staff" className="glass-btn glass-btn-primary" style={{ borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <UserPlus size={16} /> Add New Staff
          </Link>
        </div>

        {/* Filter Card */}
        <div className="glass-card mb-4" style={{ padding: '20px', borderRadius: '16px' }}>
          <form onSubmit={handleFilterSubmit} className="row g-3 align-items-center">
            <div className="col-md-5">
              <div className="position-relative">
                <input
                  type="text"
                  className="custom-glass-input w-100"
                  placeholder="Search by name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            <div className="col-md-4">
              <select
                className="custom-glass-input w-100"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ color: '#ffffff' }}
              >
                <option value="" style={{ background: '#0f172a', color: '#ffffff' }}>All Roles</option>
                <option value="Admin" style={{ background: '#0f172a', color: '#ffffff' }}>Admin</option>
                <option value="Sales person" style={{ background: '#0f172a', color: '#ffffff' }}>Sales person</option>
                <option value="Technician" style={{ background: '#0f172a', color: '#ffffff' }}>Technician</option>
              </select>
            </div>

            <div className="col-md-3">
              <button type="submit" className="glass-btn glass-btn-secondary w-100" style={{ borderRadius: '10px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Filter size={15} /> Filter Results
              </button>
            </div>
          </form>
        </div>

        {/* Staff Data Table */}
        <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0" style={{ background: 'transparent' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  <th className="ps-4 py-3" style={{ width: '70px' }}>ID</th>
                  <th className="py-3">Staff Member</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Phone</th>
                  <th className="py-3">Role</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-end pe-4" style={{ width: '220px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      Loading staff directory...
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No staff members found matching criteria.
                    </td>
                  </tr>
                ) : (
                  staffList.map((row) => {
                    const isStatusActive = row.status === 'Active';
                    const roleColor = row.role === 'Admin' ? 'rgba(147, 51, 234, 0.2)' :
                                      row.role === 'Technician' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(59, 130, 246, 0.2)';
                    const roleTextColor = row.role === 'Admin' ? '#c084fc' :
                                          row.role === 'Technician' ? '#38bdf8' : '#60a5fa';

                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td className="ps-4 fw-semibold" style={{ color: '#cbd5e1' }}>#{row.id}</td>
                        <td>
                          <span
                            onClick={() => handleOpenDetails(row)}
                            className="fw-bold text-primary text-decoration-none cursor-pointer"
                            style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                            title="Click to view full staff details"
                          >
                            {row.first_name} {row.last_name}
                          </span>
                        </td>
                        <td style={{ color: '#f8fafc' }}>{row.email}</td>
                        <td style={{ color: '#cbd5e1' }}>{row.phone || 'N/A'}</td>
                        <td>
                          <span style={{
                            background: roleColor,
                            color: roleTextColor,
                            border: `1px solid ${roleTextColor}40`,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {row.role}
                          </span>
                        </td>
                        <td>
                          {isStatusActive ? (
                            <span style={{
                              background: 'rgba(34, 197, 94, 0.15)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              color: '#4ade80',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>Active</span>
                          ) : (
                            <span style={{
                              background: 'rgba(148, 163, 184, 0.15)',
                              border: '1px solid rgba(148, 163, 184, 0.3)',
                              color: '#94a3b8',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>Inactive (Resigned)</span>
                          )}
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex justify-content-end gap-2">
                            <Link
                              to={`/admin/edit-staff/${row.id}`}
                              className="glass-btn glass-btn-primary"
                              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Pencil size={13} /> Edit Profile
                            </Link>

                            <button
                              onClick={() => handleDeleteStaff(row.id, `${row.first_name} ${row.last_name}`)}
                              className="glass-btn glass-btn-danger"
                              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px' }}
                              title="Delete Account"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Smart Glass Pagination */}
        {pagination.totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center gap-2 my-4 flex-wrap">
            <button
              disabled={pageParam <= 1}
              onClick={() => {
                const newParams = Object.fromEntries(searchParams);
                newParams.page = (pageParam - 1).toString();
                setSearchParams(newParams);
              }}
              className="repair-pagination-btn"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            {getPageNumbers(pageParam, pagination.totalPages).map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 text-light opacity-50 fw-bold">
                    &hellip;
                  </span>
                );
              }
              return (
                <button
                  key={p}
                  onClick={() => {
                    const newParams = Object.fromEntries(searchParams);
                    newParams.page = p.toString();
                    setSearchParams(newParams);
                  }}
                  className={`repair-pagination-btn ${pageParam === p ? 'repair-pagination-btn-active' : ''}`}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={pageParam >= pagination.totalPages}
              onClick={() => {
                const newParams = Object.fromEntries(searchParams);
                newParams.page = (pageParam + 1).toString();
                setSearchParams(newParams);
              }}
              className="repair-pagination-btn"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Staff Details Modal */}
        {isDetailModalOpen && selectedStaff && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 1050,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setIsDetailModalOpen(false)}
          >
            <div
              className="glass-card animate-fade-in"
              style={{
                maxWidth: '480px',
                width: '100%',
                borderRadius: '20px',
                padding: '28px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#ffffff'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0 fw-bold d-flex align-items-center gap-2" style={{ color: '#f8fafc' }}>
                  <ShieldCheck className="text-primary" size={20} /> Staff Details
                </h5>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="text-center py-3 border-bottom border-secondary mb-3">
                <div
                  className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-2"
                  style={{ width: '70px', height: '70px', background: 'rgba(99,102,241,0.2)', border: '2px solid rgba(99,102,241,0.4)' }}
                >
                  <User size={34} className="text-primary" />
                </div>
                <h4 className="fw-bold mb-1" style={{ color: '#ffffff' }}>
                  {selectedStaff.first_name} {selectedStaff.last_name}
                </h4>
                <div className="d-flex justify-content-center gap-2 mt-2">
                  <span className="badge bg-primary px-3 py-1">{selectedStaff.role}</span>
                  <span className={`badge ${selectedStaff.status === 'Active' ? 'bg-success' : 'bg-secondary'} px-3 py-1`}>
                    {selectedStaff.status}
                  </span>
                </div>
              </div>

              <div className="d-flex flex-column gap-3 py-2" style={{ fontSize: '14px' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="d-flex align-items-center gap-2" style={{ color: '#cbd5e1' }}><Mail size={15} /> Email</span>
                  <span className="fw-semibold text-light">{selectedStaff.email}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="d-flex align-items-center gap-2" style={{ color: '#cbd5e1' }}><Phone size={15} /> Phone</span>
                  <span className="fw-semibold text-light">{selectedStaff.phone || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="d-flex align-items-center gap-2" style={{ color: '#cbd5e1' }}><User size={15} /> Gender</span>
                  <span className="fw-semibold text-light">{selectedStaff.gender}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="d-flex align-items-center gap-2" style={{ color: '#cbd5e1' }}><Calendar size={15} /> Birth Date</span>
                  <span className="fw-semibold text-light">
                    {selectedStaff.birth_date ? new Date(selectedStaff.birth_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary">
                <button
                  type="button"
                  className="glass-btn glass-btn-secondary"
                  onClick={() => setIsDetailModalOpen(false)}
                  style={{ borderRadius: '8px' }}
                >
                  Close
                </button>
                <Link
                  to={`/admin/edit-staff/${selectedStaff.id}`}
                  className="glass-btn glass-btn-primary"
                  style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Pencil size={14} /> Edit Profile
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
