import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Wrench, PlusCircle, Search, XCircle, Tag, 
  Barcode, Info, Edit, Trash2, CheckCircle, ArrowLeft,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ToastAlert from '../components/ToastAlert';
import ConfirmModal from '../components/ConfirmModal';
import { formatCurrency } from '../utils/format';
import './ManageRepair.css';

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

export default function ManageRepair() {
  const { token, user, API_URL, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filterParam = searchParams.get('filter') || '';
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Search input local state
  const [searchInput, setSearchInput] = useState(searchParam);

  // Data & Pagination
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ totalResults: 0, totalPages: 1, currentPage: 1 });

  // Alerts & Toast
  const [toast, setToast] = useState({ type: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const adminRole = user?.role || '';
  const isTechnician = adminRole === 'Technician';
  const isAdmin = adminRole === 'Admin';

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/repairs`);
      url.searchParams.append('page', pageParam);
      url.searchParams.append('limit', 10);

      if (filterParam) {
        const statusMap = {
          'pending': 'Pending',
          'in-progress': 'In-progress',
          'completed': 'Completed',
          'cancelled': 'Cancelled'
        };
        const targetStatus = statusMap[filterParam.toLowerCase()] || filterParam;
        url.searchParams.append('status', targetStatus);
      }

      if (searchParam) {
        url.searchParams.append('search', searchParam);
      }

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setRepairs(data.repairs || []);
        setPagination(data.pagination || { totalResults: 0, totalPages: 1, currentPage: 1 });
      }
    } catch (err) {
      console.error('Error fetching repairs:', err);
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
    fetchRepairs();
  }, [token, authLoading, filterParam, searchParam, pageParam]);

  // Handle Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    if (filterParam) newParams.filter = filterParam;
    if (searchInput.trim()) newParams.search = searchInput.trim();
    newParams.page = '1';
    setSearchParams(newParams);
  };

  // Handle Clear Search
  const handleClearSearch = () => {
    setSearchInput('');
    const newParams = {};
    if (filterParam) newParams.filter = filterParam;
    setSearchParams(newParams);
  };

  // Handle Inline Status Change (via PATCH /api/repairs/:id/status)
  const handleStatusChange = (repairId, newStatus) => {
    setConfirmModal({
      isOpen: true,
      title: 'Change Repair Status',
      message: `Are you sure you want to change repair status to "${newStatus}"?`,
      variant: 'primary',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/repairs/${repairId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setToast({ type: 'success', message: data.message || `Status updated to "${newStatus}"` });
            setRepairs(prev => prev.map(r => r.ID === repairId ? { ...r, Status: newStatus } : r));
          } else {
            setToast({ type: 'error', message: data.message || 'Failed to update repair status' });
          }
        } catch (err) {
          console.error(err);
          setToast({ type: 'error', message: 'Network error updating repair status' });
        }
      }
    });
  };

  // Handle Delete Repair (Admin only)
  const handleDeleteRepair = (repairId) => {
    if (!isAdmin) {
      setToast({ type: 'error', message: 'Access Denied: Only Admins can delete repair records.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete Repair Record',
      message: 'Are you sure you want to permanently delete this repair record?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/repairs/${repairId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();

          if (res.ok) {
            setToast({ type: 'success', message: 'Repair log deleted successfully.' });
            fetchRepairs();
          } else {
            setToast({ type: 'error', message: data.message || 'Failed to delete repair log.' });
          }
        } catch (err) {
          setToast({ type: 'error', message: 'Error deleting repair record.' });
        }
      }
    });
  };

  return (
    <AdminLayout>
      <div className="container-fluid p-4 animate-fade-in">
        
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none text-info">Home</Link></li>
            <li className="breadcrumb-item active text-light" aria-current="page">
              Manage Repairs{filterParam ? ` - ${filterParam.charAt(0).toUpperCase() + filterParam.slice(1)}` : ''}
            </li>
          </ol>
        </nav>

        {toast.message && <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
              <Wrench className="text-secondary" /> Manage Repairs{filterParam ? ` (${filterParam.charAt(0).toUpperCase() + filterParam.slice(1)})` : ''}
            </h3>
            <p className="text-muted mb-0 small">
              {isTechnician ? 'Your assigned repair jobs and job status updates.' : 'Track hardware and device repairs, technician assignments, costs, and profits.'}
            </p>
          </div>
          {!isTechnician && (
            <div>
              <button 
                className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
                onClick={() => navigate('/admin/add-repair')}
              >
                <PlusCircle size={18} /> Log New Repair
              </button>
            </div>
          )}
        </div>

        {/* Table & Search Card */}
        <div className="card card-repairs-dark shadow-sm border-0">
          <div className="card-header bg-transparent py-3 border-secondary border-bottom">
            <form onSubmit={handleSearchSubmit} className="row g-2 justify-content-end align-items-center">
              <div className="col-auto">
                <label htmlFor="search" className="col-form-label fw-semibold text-light small">Search Filter:</label>
              </div>
              <div className="col-auto">
                <input 
                  type="text" 
                  className="form-control custom-input form-control-sm" 
                  id="search" 
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Customer, Device, or Technician"
                />
              </div>
              <div className="col-auto d-flex gap-1">
                <button type="submit" className="btn btn-primary btn-sm rounded-pill px-3">
                  <Search size={14} /> Search
                </button>
                {(searchParam || filterParam) && (
                  <button type="button" className="btn btn-secondary btn-sm rounded-pill px-3" onClick={handleClearSearch}>
                    <XCircle size={14} /> Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-dark table-hover table-repairs-dark align-middle mb-0">
                <thead>
                  <tr className="text-muted border-secondary">
                    <th className="ps-4 text-center" style={{ width: '60px' }}>#</th>
                    <th>Customer Name</th>
                    <th>Device & Issue</th>
                    {!isTechnician && <th>Cost / Income</th>}
                    <th>Technician</th>
                    <th className="text-center">Status</th>
                    <th>Date</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={!isTechnician ? 8 : 7} className="text-center py-5 text-muted">
                        Loading repair jobs...
                      </td>
                    </tr>
                  ) : repairs.length === 0 ? (
                    <tr>
                      <td colSpan={!isTechnician ? 8 : 7} className="text-center py-5 text-muted">
                        <Wrench size={40} className="d-block mb-2 text-secondary mx-auto" />
                        No repair records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    repairs.map((row, index) => {
                      const cnt = (pageParam - 1) * 10 + index + 1;
                      const statusBadge = row.Status === 'Completed' ? 'bg-success text-white' : 
                                         row.Status === 'Pending' ? 'bg-warning text-dark' : 
                                         row.Status === 'In-progress' ? 'bg-info text-dark' : 'bg-secondary text-light';

                      return (
                        <tr key={row.ID} className="border-secondary">
                          <td className="ps-4 text-center fw-semibold" style={{ color: '#cbd5e1' }}>{cnt}</td>
                          <td className="fw-bold text-white">{row.CustomerName}</td>
                          <td>
                            <div className="fw-bold text-white fs-6">{row.DeviceName}</div>
                            {(row.BrandName || row.ProductName) && (
                              <div className="small mt-0.5" style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                                <Tag size={12} className="text-primary me-1" />
                                {`${row.BrandName || ''} ${row.ProductName || ''}`.trim()}
                              </div>
                            )}
                            {row.IMEINumber && (
                              <div className="small font-monospace text-info mt-0.5" style={{ fontSize: '0.8rem' }}>
                                <Barcode size={12} className="me-1" />{row.IMEINumber}
                              </div>
                            )}
                            <div className="mt-1 d-flex align-items-start gap-1" style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.4' }} title={row.Issue}>
                              <Info size={13} className="text-warning me-1 flex-shrink-0 mt-0.5" />
                              <span>{row.Issue}</span>
                            </div>
                          </td>
                          {!isTechnician && (
                            <td>
                              <div className="text-danger small fw-semibold">Cost: Rs. {formatCurrency(row.Cost)}</div>
                              <div className="text-success fw-semibold small">Income: Rs. {formatCurrency(row.Income)}</div>
                            </td>
                          )}
                          <td>
                            <div className="fw-semibold text-white">{row.TechFirstName} {row.TechLastName}</div>
                            <div className="small d-block" style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{row.TechRole || 'Technician'}</div>
                          </td>
                          <td className="text-center">
                            {(isAdmin || isTechnician) ? (
                              <select 
                                className="form-select form-select-sm status-select-dark d-inline-block text-center"
                                value={row.Status}
                                onChange={e => handleStatusChange(row.ID, e.target.value)}
                                style={{ minWidth: '130px' }}
                              >
                                <option value="Pending">Pending</option>
                                <option value="In-progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className={`badge ${statusBadge} px-2 py-1 rounded-pill`}>
                                {row.Status}
                              </span>
                            )}
                          </td>
                          <td className="small fw-semibold" style={{ color: '#e2e8f0' }}>
                            {new Date(row.RepairDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="text-end pe-4">
                            <div className="d-flex justify-content-end gap-1">
                              <button 
                                className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"
                                onClick={() => navigate(`/admin/edit-repair/${row.ID}`)}
                              >
                                <Edit size={14} /> Edit
                              </button>
                              {isAdmin && (
                                <button 
                                  className="btn btn-sm btn-danger rounded-pill px-2 d-flex align-items-center gap-1"
                                  onClick={() => handleDeleteRepair(row.ID)}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Glass Pagination Controls */}
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

          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
