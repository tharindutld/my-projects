import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { Edit2, CheckCircle, ArrowLeft, Info, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ToastAlert from '../components/ToastAlert';
import ConfirmModal from '../components/ConfirmModal';
import './AddRepair.css';

export default function EditRepair() {
  const { token, user, API_URL, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const repairId = paramId || searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [productName, setProductName] = useState('');
  const [imeiNumber, setImeiNumber] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [issue, setIssue] = useState('');
  const [cost, setCost] = useState('');
  const [income, setIncome] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [status, setStatus] = useState('Pending');
  const [repairDate, setRepairDate] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [laborTime, setLaborTime] = useState('');

  // Dropdowns
  const [brands, setBrands] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isTechnician = user?.role === 'Technician';

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      navigate('/login?staff=true');
      return;
    }
    if (!repairId) {
      navigate('/admin/manage-repair');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Brands & Technicians
        const [resBrands, resTechs, resRepair] = await Promise.all([
          fetch(`${API_URL}/repairs/helper/brands`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/staff/technicians`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/repairs/${repairId}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (resBrands.ok) setBrands(await resBrands.json());
        if (resTechs.ok) setTechnicians(await resTechs.json());

        if (resRepair.ok) {
          const rep = await resRepair.json();
          setCustomerName(rep.CustomerName || '');
          setBrandName(rep.BrandName || '');
          setProductName(rep.ProductName || '');
          setImeiNumber(rep.IMEINumber || '');
          setDeviceName(rep.DeviceName || '');
          setIssue(rep.Issue || '');
          setCost(rep.Cost ? rep.Cost.toString() : '0');
          setIncome(rep.Income ? rep.Income.toString() : '0');
          setTechnicianId(rep.TechnicianId ? rep.TechnicianId.toString() : '');
          setStatus(rep.Status || 'Pending');
          setRepairDate(rep.RepairDate ? new Date(rep.RepairDate).toISOString().slice(0, 10) : '');
          setRepairNotes(rep.RepairNotes || '');
          setPartsUsed(rep.PartsUsed || '');
          setLaborTime(rep.LaborTime || '');
        } else {
          setError('Repair record not found.');
          setTimeout(() => navigate('/admin/manage-repairs.php'), 1500);
        }
      } catch (err) {
        console.error('Error loading edit repair:', err);
        setError('Server error loading repair details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, authLoading, repairId]);

  const executeUpdate = async () => {
    setShowConfirmModal(false);
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/repairs/${repairId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          CustomerName: customerName,
          BrandName: brandName,
          ProductName: productName,
          IMEINumber: imeiNumber,
          DeviceName: deviceName,
          Issue: issue,
          Cost: parseFloat(cost || 0),
          Income: parseFloat(income || 0),
          TechnicianId: parseInt(technicianId),
          Status: status,
          RepairDate: repairDate,
          RepairNotes: repairNotes,
          PartsUsed: partsUsed,
          LaborTime: laborTime
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Repair job updated successfully.');
        setTimeout(() => navigate('/admin/manage-repairs.php'), 1200);
      } else {
        setError(data.message || 'Failed to update repair job.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error updating repair record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAttempt = (e) => {
    e.preventDefault();
    setError('');
    const errors = {};

    if (!isTechnician) {
      if (!customerName.trim() || !/^[a-zA-Z\s]+$/.test(customerName.trim())) {
        errors.customerName = 'Customer Name can only contain letters and spaces.';
      }
      if (!deviceName.trim()) {
        errors.deviceName = 'Device Name is required.';
      }
      if (!issue.trim()) {
        errors.issue = 'Issue description is required.';
      }
      if (isNaN(cost) || cost === '' || parseFloat(cost) < 0) {
        errors.cost = 'Cost must be a valid non-negative number.';
      }
      if (isNaN(income) || income === '' || parseFloat(income) < 0) {
        errors.income = 'Income must be a valid non-negative number.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the highlighted errors in the form.');
      return;
    }

    setFieldErrors({});
    setShowConfirmModal(true);
  };

  return (
    <AdminLayout>
      <div className="container-fluid p-4 animate-fade-in">
        
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none text-info">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/admin/manage-repair" className="text-decoration-none text-info">Manage Repairs</Link></li>
            <li className="breadcrumb-item active text-light" aria-current="page">Edit Repair</li>
          </ol>
        </nav>

        {error && <ToastAlert type="error" message={error} onClose={() => setError('')} />}
        {success && <ToastAlert type="success" message={success} onClose={() => setSuccess('')} />}

        <ConfirmModal
          isOpen={showConfirmModal}
          title="Confirm Changes"
          message="Please confirm that you wish to save these changes to the repair log."
          onConfirm={executeUpdate}
          onCancel={() => setShowConfirmModal(false)}
        />

        <div className="card card-repair border-0">
          <div className="card-repair-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-white d-flex align-items-center gap-2">
              <Edit2 /> Edit Repair Log #{repairId}
            </h5>
            <button 
              className="btn btn-outline-light btn-sm rounded-pill d-flex align-items-center gap-1"
              onClick={() => navigate('/admin/manage-repair')}
            >
              <ArrowLeft size={16} /> Back to Repairs
            </button>
          </div>

          <div className="card-body p-4">
            {loading ? (
              <div className="text-muted py-5 text-center">Loading repair details...</div>
            ) : (
              <form noValidate onSubmit={handleSubmitAttempt}>
                {isTechnician ? (
                  <>
                    <div className="alert alert-info border-0 py-2 mb-4 small d-flex align-items-center gap-2">
                      <Info size={16} /> As a Technician, you can update the job status and log technical details only.
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-muted small">Customer Name</label>
                        <input type="text" className="form-control custom-input bg-dark" value={customerName} readOnly />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-muted small">Device Name</label>
                        <input type="text" className="form-control custom-input bg-dark" value={deviceName} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold text-muted small">Brand Name</label>
                        <input type="text" className="form-control custom-input bg-dark" value={brandName || 'N/A'} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold text-muted small">Product Name</label>
                        <input type="text" className="form-control custom-input bg-dark" value={productName || 'N/A'} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold text-muted small">IMEI Number</label>
                        <input type="text" className="form-control custom-input bg-dark" value={imeiNumber || 'N/A'} readOnly />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-muted small">Issue Details</label>
                        <textarea className="form-control custom-input bg-dark" rows={2} value={issue} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold text-light">Job Status <span className="text-danger">*</span></label>
                        <select className="form-select custom-input" value={status} onChange={e => setStatus(e.target.value)} required>
                          <option value="Pending">Pending</option>
                          <option value="In-progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold text-light">Labor Time</label>
                        <input type="text" className="form-control custom-input" value={laborTime} onChange={e => setLaborTime(e.target.value)} placeholder="e.g. 2h 30m" />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold text-light">Parts Used</label>
                        <input type="text" className="form-control custom-input" value={partsUsed} onChange={e => setPartsUsed(e.target.value)} placeholder="e.g. Screen, Battery" />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-light">Repair Notes / Technical Log</label>
                        <textarea className="form-control custom-input" rows={4} value={repairNotes} onChange={e => setRepairNotes(e.target.value)} placeholder="Detail work performed..." />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="customer_name" className="form-label fw-semibold text-light">Customer Full Name <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className={`form-control custom-input ${fieldErrors.customerName ? 'is-invalid border-danger' : ''}`}
                        id="customer_name" 
                        value={customerName} 
                        onChange={e => { setCustomerName(e.target.value); setFieldErrors(prev => ({ ...prev, customerName: '' })); }} 
                        required 
                        pattern="[a-zA-Z\s]+" 
                        placeholder="e.g. Ruwan Perera" 
                      />
                      {fieldErrors.customerName && <div className="text-danger extra-small mt-1">{fieldErrors.customerName}</div>}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="brand_name" className="form-label fw-semibold text-light">Brand Name</label>
                      <select className="form-select custom-input" id="brand_name" value={brandName} onChange={e => setBrandName(e.target.value)}>
                        <option value="">Select Brand...</option>
                        {brands.map((b, i) => (
                          <option key={i} value={b.BrandName}>{b.BrandName}</option>
                        ))}
                        <option value="Other">Other / Customer Brand</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="product_name" className="form-label fw-semibold text-light">Product / Model Name</label>
                      <input type="text" className="form-control custom-input" id="product_name" value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. iPhone 15 Pro" />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="imei_number" className="form-label fw-semibold text-light">IMEI Number</label>
                      <input type="text" className="form-control custom-input" id="imei_number" value={imeiNumber} onChange={e => setImeiNumber(e.target.value)} maxLength={18} placeholder="e.g. 358901234567890" />
                    </div>

                    <div className="col-12">
                      <label htmlFor="device_name" className="form-label fw-semibold text-light">Device Display Name <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className={`form-control custom-input ${fieldErrors.deviceName ? 'is-invalid border-danger' : ''}`}
                        id="device_name" 
                        value={deviceName} 
                        onChange={e => { setDeviceName(e.target.value); setFieldErrors(prev => ({ ...prev, deviceName: '' })); }} 
                        required 
                        placeholder="e.g. iPhone 15 Pro" 
                      />
                      {fieldErrors.deviceName && <div className="text-danger extra-small mt-1">{fieldErrors.deviceName}</div>}
                    </div>

                    <div className="col-12">
                      <label htmlFor="issue" className="form-label fw-semibold text-light">Issue Details <span className="text-danger">*</span></label>
                      <textarea 
                        className={`form-control custom-input ${fieldErrors.issue ? 'is-invalid border-danger' : ''}`}
                        id="issue" 
                        rows={3} 
                        value={issue} 
                        onChange={e => { setIssue(e.target.value); setFieldErrors(prev => ({ ...prev, issue: '' })); }} 
                        required 
                        placeholder="Describe fault..." 
                      />
                      {fieldErrors.issue && <div className="text-danger extra-small mt-1">{fieldErrors.issue}</div>}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="cost" className="form-label fw-semibold text-light">Estimated / Actual Cost (Rs.) <span className="text-danger">*</span></label>
                      <input 
                        type="number" 
                        className={`form-control custom-input ${fieldErrors.cost ? 'is-invalid border-danger' : ''}`}
                        id="cost" 
                        step="0.01" 
                        min="0" 
                        value={cost} 
                        onChange={e => { setCost(e.target.value); setFieldErrors(prev => ({ ...prev, cost: '' })); }} 
                        required 
                      />
                      {fieldErrors.cost && <div className="text-danger extra-small mt-1">{fieldErrors.cost}</div>}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="income" className="form-label fw-semibold text-light">Income Charged to Customer (Rs.) <span className="text-danger">*</span></label>
                      <input 
                        type="number" 
                        className={`form-control custom-input ${fieldErrors.income ? 'is-invalid border-danger' : ''}`}
                        id="income" 
                        step="0.01" 
                        min="0" 
                        value={income} 
                        onChange={e => { setIncome(e.target.value); setFieldErrors(prev => ({ ...prev, income: '' })); }} 
                        required 
                      />
                      {fieldErrors.income && <div className="text-danger extra-small mt-1">{fieldErrors.income}</div>}
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="technician_id" className="form-label fw-semibold text-light">Assigned Technician / Staff <span className="text-danger">*</span></label>
                      <select className="form-select custom-input" id="technician_id" value={technicianId} onChange={e => setTechnicianId(e.target.value)} required>
                        <option value="" disabled>Select technician...</option>
                        {technicians.map(t => (
                          <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="status" className="form-label fw-semibold text-light">Job Status <span className="text-danger">*</span></label>
                      <select className="form-select custom-input" id="status" value={status} onChange={e => setStatus(e.target.value)} required>
                        <option value="Pending">Pending</option>
                        <option value="In-progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="repair_date" className="form-label fw-semibold text-light">Repair / Log Date <span className="text-danger">*</span></label>
                      <input type="date" className="form-control custom-input" id="repair_date" value={repairDate} max={new Date().toISOString().slice(0, 10)} onChange={e => setRepairDate(e.target.value)} required />
                    </div>
                  </div>
                )}

                <div className="mt-4 text-end d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary px-4 rounded-pill" onClick={() => navigate('/admin/manage-repair')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4 rounded-pill d-flex align-items-center gap-2" disabled={submitting}>
                    <CheckCircle size={18} /> {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
