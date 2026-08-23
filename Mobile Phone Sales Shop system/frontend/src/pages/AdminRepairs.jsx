import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Check, AlertCircle, Wrench, Calendar, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';
import ToastAlert from '../components/ToastAlert';

export default function AdminRepairs() {
  const { token, user, API_URL } = useAuth();
  const navigate = useNavigate();

  // Lists
  const [repairs, setRepairs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Filters & State
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTech, setFilterTech] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit / Add Modal States
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [productName, setProductName] = useState('');
  const [imeiNumber, setImeiNumber] = useState('');
  const [issue, setIssue] = useState('');
  const [cost, setCost] = useState('0');
  const [income, setIncome] = useState('0');
  const [status, setStatus] = useState('Pending');
  const [techId, setTechId] = useState('');
  const [repairDate, setRepairDate] = useState(new Date().toISOString().slice(0, 10));
  const [partsUsed, setPartsUsed] = useState('');
  const [laborTime, setLaborTime] = useState('');
  const [repairNotes, setRepairNotes] = useState('');

  // Toast / Confirm modal state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const isTechnician = user?.role === 'Technician';
  const isAdmin = user?.role === 'Admin';
  const isSales = user?.role === 'Sales person';

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/repairs`);
      url.searchParams.append('page', currentPage);
      if (filterStatus) url.searchParams.append('status', filterStatus);
      if (filterTech) url.searchParams.append('technicianId', filterTech);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRepairs(data.repairs);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch(`${API_URL}/staff/technicians`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTechnicians(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login?staff=true');
      return;
    }
    fetchRepairs();
    fetchTechnicians();
  }, [token, currentPage, filterStatus, filterTech]);

  const handleOpenEdit = (repair) => {
    setSelectedRepair(repair);
    setIsAddMode(false);
    setCustomerName(repair.CustomerName);
    setDeviceName(repair.DeviceName);
    setBrandName(repair.BrandName || '');
    setProductName(repair.ProductName || '');
    setImeiNumber(repair.IMEINumber || '');
    setIssue(repair.Issue);
    setCost(repair.Cost.toString());
    setIncome(repair.Income.toString());
    setStatus(repair.Status);
    setTechId(repair.TechnicianId.toString());
    setRepairDate(new Date(repair.RepairDate).toISOString().slice(0, 10));
    setPartsUsed(repair.PartsUsed || '');
    setLaborTime(repair.LaborTime || '');
    setRepairNotes(repair.RepairNotes || '');
    setError('');
    setSuccess('');
  };

  const handleOpenAdd = () => {
    setSelectedRepair(null);
    setIsAddMode(true);
    setCustomerName('');
    setDeviceName('');
    setBrandName('');
    setProductName('');
    setImeiNumber('');
    setIssue('');
    setCost('0');
    setIncome('0');
    setStatus('Pending');
    setTechId(technicians.length > 0 ? technicians[0].id.toString() : '');
    setRepairDate(new Date().toISOString().slice(0, 10));
    setPartsUsed('');
    setLaborTime('');
    setRepairNotes('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!customerName || !deviceName || !issue || !techId || !repairDate) {
      setError('Customer name, device details, issue description, technician, and repair date are required.');
      return;
    }

    try {
      let res;
      if (isAddMode) {
        res = await fetch(`${API_URL}/repairs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            CustomerName: customerName,
            DeviceName: deviceName,
            BrandName: brandName,
            ProductName: productName,
            IMEINumber: imeiNumber,
            Issue: issue,
            Cost: parseFloat(cost),
            Income: parseFloat(income),
            TechnicianId: parseInt(techId),
            RepairDate: repairDate,
            RepairNotes: repairNotes,
            PartsUsed: partsUsed,
            LaborTime: laborTime
          })
        });
      } else {
        res = await fetch(`${API_URL}/repairs/${selectedRepair.ID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            CustomerName: customerName,
            DeviceName: deviceName,
            BrandName: brandName,
            ProductName: productName,
            IMEINumber: imeiNumber,
            Issue: issue,
            Cost: parseFloat(cost),
            Income: parseFloat(income),
            TechnicianId: parseInt(techId),
            Status: status,
            RepairDate: repairDate,
            RepairNotes: repairNotes,
            PartsUsed: partsUsed,
            LaborTime: laborTime
          })
        });
      }

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setSelectedRepair(null);
        setIsAddMode(false);
        fetchRepairs();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to save repair job record.');
    }
  };

  const handleDelete = (repairId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Repair Record',
      message: 'Are you sure you want to permanently delete this repair job record?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/repairs/${repairId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setSuccess('Repair job deleted successfully.');
            setSelectedRepair(null);
            fetchRepairs();
          } else {
            const data = await res.json();
            setError(data.message || 'Failed to delete repair job.');
          }
        } catch (err) {
          setError('Error requesting repair job deletion.');
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <button onClick={() => navigate('/admin')} className="glass-btn glass-btn-secondary" style={{ borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Repair & Diagnostics Center</h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="glass-input">
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In-progress">In-progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Technician Filter */}
          {!isTechnician && (
            <select value={filterTech} onChange={(e) => { setFilterTech(e.target.value); setCurrentPage(1); }} className="glass-input">
              <option value="">All Technicians</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          )}

          {/* Add Job */}
          {!isTechnician && (
            <button onClick={handleOpenAdd} className="glass-btn" style={{ borderRadius: '8px' }}>
              <Plus size={16} /> Log Repair Job
            </button>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: (selectedRepair || isAddMode) ? '1.2fr 1fr' : '1fr',
        gap: '30px',
        alignItems: 'flex-start'
      }}>
        {/* Repairs List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading repair jobs...</div>
          ) : repairs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No repair jobs found matching criteria.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {repairs.map(rep => (
                <div key={rep.ID} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <strong style={{ fontSize: '15px' }}>Job #{rep.ID}: {rep.CustomerName}</strong>
                    <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Device: {rep.DeviceName} ({rep.BrandName}) &bull; Diagnostic: {rep.Issue}
                    </span>
                    <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)' }}>
                      Assigned: {rep.TechFirstName} {rep.TechLastName} &bull; Date: {new Date(rep.RepairDate).toLocaleDateString()}
                    </span>
                    <div style={{ marginTop: '8px' }}>
                      <span style={{
                        background: rep.Status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : rep.Status === 'Cancelled' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: rep.Status === 'Completed' ? 'var(--success)' : rep.Status === 'Cancelled' ? 'var(--danger)' : 'var(--warning)',
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700'
                      }}>{rep.Status}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700' }}>Cost: Rs. {parseFloat(rep.Cost).toLocaleString()}</div>
                      <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>Charge: Rs. {parseFloat(rep.Income).toLocaleString()}</div>
                    </div>
                    <button onClick={() => handleOpenEdit(rep)} className="glass-btn glass-btn-secondary" style={{ padding: '8px 12px', borderRadius: '8px' }}>
                      <Wrench size={14} /> Diagnose
                    </button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="glass-btn glass-btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  Prev
                </button>
                <span style={{ alignSelf: 'center', fontSize: '13px' }}>Page {currentPage} of {pagination.totalPages}</span>
                <button
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  className="glass-btn glass-btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Repair Edit Panel / Add Panel */}
        {(selectedRepair || isAddMode) && (
          <div className="glass-panel animate-fade-in" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>
                {isAddMode ? 'Log New Repair Job' : `Diagnose Job #${selectedRepair.ID}`}
              </h2>
              <button onClick={() => { setSelectedRepair(null); setIsAddMode(false); }} className="glass-btn glass-btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Close</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Customer Name *</label>
                <input type="text" className="glass-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={isTechnician} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Device Name *</label>
                  <input type="text" className="glass-input" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} disabled={isTechnician} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Brand Name</label>
                  <input type="text" className="glass-input" value={brandName} onChange={(e) => setBrandName(e.target.value)} disabled={isTechnician} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Product Variant</label>
                  <input type="text" className="glass-input" value={productName} onChange={(e) => setProductName(e.target.value)} disabled={isTechnician} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>IMEI Number</label>
                  <input type="text" className="glass-input" value={imeiNumber} onChange={(e) => setImeiNumber(e.target.value)} disabled={isTechnician} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Reported Issue / Diagnostic *</label>
                <textarea className="glass-input" style={{ minHeight: '80px', resize: 'vertical' }} value={issue} onChange={(e) => setIssue(e.target.value)} disabled={isTechnician} required />
              </div>

              {/* Assignment */}
              {!isTechnician && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Assign Technician *</label>
                  <select className="glass-input" value={techId} onChange={(e) => setTechId(e.target.value)} required>
                    <option value="">Select Technician</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dates */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Log Date *</label>
                <input type="date" className="glass-input" value={repairDate} onChange={(e) => setRepairDate(e.target.value)} disabled={isTechnician} required />
              </div>

              {/* Diagnostics Cost pricing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Diagnostic Parts Cost (Rs.)</label>
                  <input type="number" step="0.01" className="glass-input" value={cost} onChange={(e) => setCost(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Diagnostic Income Charge (Rs.)</label>
                  <input type="number" step="0.01" className="glass-input" value={income} onChange={(e) => setIncome(e.target.value)} />
                </div>
              </div>

              {/* Status */}
              {!isAddMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Repair Status</label>
                  <select className="glass-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Pending">Pending</option>
                    <option value="In-progress">In-progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Parts Used</label>
                <input type="text" placeholder="e.g. LCD Screen, Battery" className="glass-input" value={partsUsed} onChange={(e) => setPartsUsed(e.target.value)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Labor Time</label>
                <input type="text" placeholder="e.g. 2 hours, 45 mins" className="glass-input" value={laborTime} onChange={(e) => setLaborTime(e.target.value)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Diagnostic Repair Notes</label>
                <textarea className="glass-input" style={{ minHeight: '80px', resize: 'vertical' }} value={repairNotes} onChange={(e) => setRepairNotes(e.target.value)} />
              </div>

              <button type="submit" className="glass-btn" style={{ borderRadius: '8px', marginTop: '10px' }}>
                Save Repair Records
              </button>

              {isAdmin && !isAddMode && (
                <button type="button" onClick={() => handleDelete(selectedRepair.ID)} className="glass-btn glass-btn-danger" style={{ borderRadius: '8px', marginTop: '5px' }}>
                  Permanently Delete Repair Record
                </button>
              )}
            </form>
          </div>
        )}
      </div>

    </div>
    </AdminLayout>
  );
}
