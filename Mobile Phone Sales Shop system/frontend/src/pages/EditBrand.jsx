import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pencil, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';

export default function EditBrand() {
  const { id } = useParams();
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [brandName, setBrandName] = useState('');
  const [status, setStatus] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate('/login?staff=true');
      return;
    }
    if (user && user.role === 'Customer') {
      navigate('/');
      return;
    }

    fetchBrandDetails();
  }, [id, token, user, authLoading]);

  const fetchBrandDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/products/brands`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const brands = await res.json();
        const found = brands.find(b => String(b.ID) === String(id));
        if (found) {
          setBrandName(found.BrandName || '');
          setStatus(String(found.Status) === '1' || found.Status === 1);
        } else {
          setErrorMsg('Brand not found.');
        }
      } else {
        setErrorMsg('Failed to fetch brand details.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttempt = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const errors = {};

    const trimmed = brandName.trim();
    if (!trimmed) {
      errors.brandName = 'Brand name is required.';
    } else if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) {
      errors.brandName = 'Brand name cannot contain special characters.';
    } else if (!/[a-zA-Z]/.test(trimmed)) {
      errors.brandName = 'Brand name cannot consist of only numbers.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg('Please fix the highlighted errors in the form.');
      return;
    }

    setFieldErrors({});
    setShowConfirmModal(true);
  };

  const executeUpdateBrand = async () => {
    setShowConfirmModal(false);
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    const trimmed = brandName.trim();
    try {
      const res = await fetch(`${API_URL}/products/brands/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          brandName: trimmed,
          status: status ? 1 : 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Brand name has been updated successfully!');
        setTimeout(() => navigate('/admin/manage-brand'), 1200);
      } else {
        setErrorMsg(data.message || 'Failed to update brand.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error communicating with server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--primary)',
              background: 'rgba(99,102,241,0.12)',
              padding: '4px 10px',
              borderRadius: '12px'
            }}>Catalog Management</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Pencil size={26} className="text-primary" /> Update Brand
            </h1>
          </div>
          <Link to="/admin/manage-brand" className="glass-btn-secondary" style={{ borderRadius: '20px', fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Back to Brands
          </Link>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px'
          }}>
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: '#34d399',
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px'
          }}>
            <CheckCircle size={18} /> {successMsg}
          </div>
        )}

        <ConfirmModal
          isOpen={showConfirmModal}
          title="Confirm Brand Update"
          message={`Please confirm that you wish to update brand name to "${brandName.trim()}".`}
          onConfirm={executeUpdateBrand}
          onCancel={() => setShowConfirmModal(false)}
        />

        {/* Glass Form Panel */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.75)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading brand details...
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmitAttempt} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
                  Brand Name <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`glass-input ${fieldErrors.brandName ? 'border-danger' : ''}`}
                  value={brandName}
                  onChange={(e) => { setBrandName(e.target.value); setFieldErrors(prev => ({ ...prev, brandName: '' })); }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '15px'
                  }}
                />
                {fieldErrors.brandName && (
                  <span className="text-danger" style={{ fontSize: '13px', fontWeight: '600' }}>
                    {fieldErrors.brandName}
                  </span>
                )}
              </div>

              {/* Status Switch */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '16px 20px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#fff' }}>Active Status</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Enable or disable this brand in customer storefront filters
                  </p>
                </div>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                  <input
                    type="checkbox"
                    checked={status}
                    onChange={(e) => setStatus(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: status ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                    transition: '0.3s',
                    borderRadius: '26px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '20px',
                      width: '20px',
                      left: status ? '24px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#fff',
                      transition: '0.3s',
                      borderRadius: '50%',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}></span>
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="glass-btn"
                  style={{
                    padding: '12px 28px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '700'
                  }}
                >
                  {submitting ? 'Updating...' : 'Update Brand'}
                </button>
                <Link
                  to="/admin/manage-brand"
                  className="glass-btn-secondary"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
