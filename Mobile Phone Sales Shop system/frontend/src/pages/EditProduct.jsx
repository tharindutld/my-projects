import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pencil, CheckCircle, AlertCircle, ArrowLeft, Plus, Save, Trash2, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';

export default function EditProduct() {
  const { id } = useParams();
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Form State
  const [pname, setPname] = useState('');
  const [bname, setBname] = useState('');
  const [cname, setCname] = useState('');
  const [modelno, setModelno] = useState('');
  const [fcamera, setFcamera] = useState('');
  const [processor, setProcessor] = useState('');
  const [display, setDisplay] = useState('');
  const [simtype, setSimtype] = useState('');
  const [kfeatures, setKfeatures] = useState('');
  const [specification, setSpecification] = useState('');
  const [status, setStatus] = useState(true);

  // Product Variants
  const [variants, setVariants] = useState([]);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [vColor, setVColor] = useState('');
  const [vRam, setVRam] = useState('4GB');
  const [vRom, setVRom] = useState('128GB');
  const [vPrice, setVPrice] = useState('10000');
  const [vStock, setVStock] = useState('0');

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

    fetchMetadata();
    fetchProductDetails();
  }, [id, token, user, authLoading]);

  const fetchMetadata = async () => {
    try {
      const [resB, resC] = await Promise.all([
        fetch(`${API_URL}/products/brands`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/products/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (resB.ok) setBrands(await resB.json());
      if (resC.ok) setCategories(await resC.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProductDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPname(data.ProductName || '');
        setBname(data.BrandName || '');
        setCname(data.CategoryName || '');
        setModelno(data.ModelNumber || '');
        setFcamera(data.FrontCamera || '');
        setProcessor(data.Processor || '');
        setDisplay(data.Display || '');
        setSimtype(data.SimType || 'Dual SIM');
        setKfeatures(data.KeyFeature || '');
        setSpecification(data.Specification || '');
        setStatus(String(data.Status) === '1' || data.Status === 1);
        setVariants(data.variants || []);
      } else {
        setErrorMsg('Failed to fetch product details.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGeneralAttempt = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const errors = {};

    const pattern = /^[a-zA-Z0-9\s\/]+$/;

    if (!pname.trim()) {
      errors.pname = 'Product Name is required.';
    } else if (!pattern.test(pname.trim())) {
      errors.pname = 'Product Name cannot contain special characters, plus, minus, or decimals.';
    } else if (!/[a-zA-Z]/.test(pname.trim())) {
      errors.pname = 'Product Name must contain at least one letter.';
    }

    if (!bname) errors.bname = 'Brand selection is required.';
    if (!cname) errors.cname = 'Category selection is required.';

    if (!modelno.trim()) {
      errors.modelno = 'Model Number is required.';
    } else if (!pattern.test(modelno.trim())) {
      errors.modelno = 'Model Number cannot contain special characters, plus, minus, or decimals.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg('Please fix the highlighted errors in the form.');
      return;
    }

    setFieldErrors({});
    setShowConfirmModal(true);
  };

  const executeUpdateGeneral = async () => {
    setShowConfirmModal(false);
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ProductName: pname.trim(),
          BrandName: bname,
          CategoryName: cname,
          ModelNumber: modelno.trim(),
          SimType: simtype,
          Display: display.trim(),
          Processor: processor.trim(),
          FrontCamera: fcamera.trim(),
          KeyFeature: kfeatures.trim(),
          Specification: specification.trim(),
          Status: status ? 1 : 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Product general information updated successfully!');
      } else {
        setErrorMsg(data.message || 'Failed to update product.');
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
      <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1000px' }}>
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
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '10px'
            }}>Inventory Catalog</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Pencil size={26} className="text-primary" /> Update Product
            </h1>
          </div>
          <Link to="/admin/manage-product" className="glass-btn-secondary" style={{ borderRadius: '20px', fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Back to Catalog
          </Link>
        </div>

        {/* Alerts */}
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
          title="Confirm Product Update"
          message={`Please confirm that you wish to save changes for "${pname.trim()}".`}
          onConfirm={executeUpdateGeneral}
          onCancel={() => setShowConfirmModal(false)}
        />

        {/* General Details Panel */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.75)', marginBottom: '28px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading product information...
            </div>
          ) : (
            <form noValidate onSubmit={handleUpdateGeneralAttempt} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h5 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', margin: '0 0 8px 0' }}>General Details</h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Product Name *</label>
                  <input type="text" className={`glass-input ${fieldErrors.pname ? 'border-danger' : ''}`} value={pname} onChange={e => { setPname(e.target.value); setFieldErrors(prev => ({ ...prev, pname: '' })); }} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
                  {fieldErrors.pname && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.pname}</div>}
                </div>
                <div className="col-md-3">
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Brand *</label>
                  <select className={`glass-input ${fieldErrors.bname ? 'border-danger' : ''}`} value={bname} onChange={e => { setBname(e.target.value); setFieldErrors(prev => ({ ...prev, bname: '' })); }} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}>
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b.ID} value={b.BrandName}>{b.BrandName}</option>)}
                  </select>
                  {fieldErrors.bname && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.bname}</div>}
                </div>
                <div className="col-md-3">
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Category *</label>
                  <select className={`glass-input ${fieldErrors.cname ? 'border-danger' : ''}`} value={cname} onChange={e => { setCname(e.target.value); setFieldErrors(prev => ({ ...prev, cname: '' })); }} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.ID} value={c.CategoryName}>{c.CategoryName}</option>)}
                  </select>
                  {fieldErrors.cname && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.cname}</div>}
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Model Number *</label>
                  <input type="text" className={`glass-input ${fieldErrors.modelno ? 'border-danger' : ''}`} value={modelno} onChange={e => { setModelno(e.target.value); setFieldErrors(prev => ({ ...prev, modelno: '' })); }} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
                  {fieldErrors.modelno && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.modelno}</div>}
                </div>
                <div className="col-md-6">
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>SIM Support *</label>
                  <select className={`glass-input ${fieldErrors.simtype ? 'border-danger' : ''}`} value={simtype} onChange={e => { setSimtype(e.target.value); setFieldErrors(prev => ({ ...prev, simtype: '' })); }} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}>
                    {['Single SIM', 'Dual SIM', 'eSIM', 'Dual SIM (Nano-SIM + eSIM)', 'None'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {fieldErrors.simtype && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.simtype}</div>}
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Front Camera</label>
                  <input type="text" className="glass-input" value={fcamera} onChange={e => setFcamera(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
                </div>
                <div className="col-md-4">
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Processor</label>
                  <input type="text" className="glass-input" value={processor} onChange={e => setProcessor(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
                </div>
                <div className="col-md-4">
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Display</label>
                  <input type="text" className="glass-input" value={display} onChange={e => setDisplay(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Key Features</label>
                <textarea className="glass-input" rows="2" value={kfeatures} onChange={e => setKfeatures(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Specification</label>
                <textarea className="glass-input" rows="2" value={specification} onChange={e => setSpecification(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
              </div>

              {/* Status Switch */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#fff' }}>Active Status</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Storefront visibility toggle</p>
                </div>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                  <input type="checkbox" checked={status} onChange={e => setStatus(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: status ? 'var(--primary)' : 'rgba(255,255,255,0.2)', transition: '0.3s', borderRadius: '26px' }}>
                    <span style={{ position: 'absolute', content: '""', height: '20px', width: '20px', left: status ? '24px' : '3px', bottom: '3px', backgroundColor: '#fff', transition: '0.3s', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}></span>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" disabled={submitting} className="glass-btn" style={{ padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} /> Save Changes
                </button>
                <Link to="/admin/manage-product" className="glass-btn-secondary" style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}>Cancel</Link>
              </div>
            </form>
          )}
        </div>

        {/* Variants Management Glass Panel */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.75)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h5 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} className="text-primary" /> Product Variants
            </h5>
          </div>

          {/* Variants Table */}
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 16px' }}>Color</th>
                  <th style={{ padding: '12px 16px' }}>RAM</th>
                  <th style={{ padding: '12px 16px' }}>Storage (ROM)</th>
                  <th style={{ padding: '12px 16px' }}>Price (LKR)</th>
                  <th style={{ padding: '12px 16px' }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {variants.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No variants registered for this product.
                    </td>
                  </tr>
                ) : (
                  variants.map(v => (
                    <tr key={v.ID} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#fff' }}>{v.Color}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{v.RAM}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{v.ROM}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#38bdf8' }}>LKR {parseFloat(v.Price || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#34d399' }}>{v.Stock || 0} units</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
