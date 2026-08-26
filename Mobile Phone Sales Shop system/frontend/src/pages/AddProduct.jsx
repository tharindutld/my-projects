import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Smartphone, CheckCircle, AlertCircle, ArrowLeft, PlusCircle, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';

export default function AddProduct() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Form State
  const [pname, setPname] = useState('');
  const [bname, setBname] = useState('');
  const [cname, setCname] = useState('');
  const [modelno, setModelno] = useState('');
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('');
  const [ram, setRam] = useState('');
  const [rom, setRom] = useState('');
  const [fcamera, setFcamera] = useState('');
  const [processor, setProcessor] = useState('');
  const [display, setDisplay] = useState('');
  const [simtype, setSimtype] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [tabletHasSim, setTabletHasSim] = useState(false);
  const [kfeatures, setKfeatures] = useState('');
  const [specification, setSpecification] = useState('');
  const [status, setStatus] = useState(true);

  // IMEI state
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');

  // Images state (storing sample filenames or text)
  const [image1, setImage1] = useState('phone_sample1.jpg');
  const [image2, setImage2] = useState('phone_sample2.jpg');
  const [image3, setImage3] = useState('phone_sample3.jpg');

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

    fetchBrandsAndCategories();
  }, [token, user, authLoading]);

  const fetchBrandsAndCategories = async () => {
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

  const isDualSim = simtype.toLowerCase().includes('dual');
  const isTablet = cname === 'Tablet';
  const showSimAndImei = !isTablet || (isTablet && tabletHasSim);

  const handleSubmitAttempt = (e) => {
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

    if (!price || isNaN(price) || parseFloat(price) < 10000) {
      errors.price = 'Selling Price must be at least 10,000 LKR.';
    }

    if (!color.trim()) errors.color = 'Product Color is required.';
    if (!ram) errors.ram = 'RAM specification is required.';
    if (!rom) errors.rom = 'Storage (ROM) specification is required.';
    if (!fcamera.trim()) errors.fcamera = 'Front Camera details are required.';
    if (!processor.trim()) errors.processor = 'Processor model is required.';
    if (!display.trim()) errors.display = 'Display specification is required.';

    if (showSimAndImei) {
      if (!simtype) errors.simtype = 'SIM Support Type is required.';
      if (!imei1 || imei1.length !== 15 || !/^\d{15}$/.test(imei1)) {
        errors.imei1 = 'IMEI 1 must be exactly 15 numeric digits.';
      }
      if (isDualSim) {
        if (!imei2 || imei2.length !== 15 || !/^\d{15}$/.test(imei2)) {
          errors.imei2 = 'IMEI 2 must be exactly 15 numeric digits for Dual SIM devices.';
        } else if (imei1 === imei2) {
          errors.imei2 = 'IMEI 1 and IMEI 2 cannot be identical.';
        }
      }
    }

    if (!kfeatures.trim()) errors.kfeatures = 'Key Features are required.';
    if (!specification.trim()) errors.specification = 'Technical Specification is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg('Please fix the highlighted errors in the form.');
      return;
    }

    setFieldErrors({});
    setShowConfirmModal(true);
  };

  const executeAddProduct = async () => {
    setShowConfirmModal(false);
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ProductName: pname.trim(),
          BrandName: bname,
          CategoryName: cname,
          ModelNumber: modelno.trim(),
          Price: parseFloat(price),
          SimType: showSimAndImei ? simtype : 'None',
          Display: display.trim(),
          Processor: processor.trim(),
          FrontCamera: fcamera.trim(),
          KeyFeature: kfeatures.trim(),
          Specification: specification.trim(),
          Image1: image1,
          Image2: image2,
          Image3: image3,
          Status: status ? 1 : 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Product "${pname.trim()}" created successfully.`);
        setTimeout(() => navigate('/admin/manage-product'), 1200);
      } else {
        setErrorMsg(data.message || 'Failed to create product.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to communicate with server.');
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
              <Smartphone size={28} className="text-primary" /> Add New Product
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
          title="Confirm New Product"
          message={`Please confirm that you wish to register product "${pname.trim()}" in the inventory.`}
          onConfirm={executeAddProduct}
          onCancel={() => setShowConfirmModal(false)}
        />

        {/* Glass Form Panel */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.75)' }}>
          <form noValidate onSubmit={handleSubmitAttempt} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* General Info Row */}
            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
                  Product Name <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`glass-input ${fieldErrors.pname ? 'border-danger' : ''}`}
                  value={pname}
                  onChange={e => { setPname(e.target.value); setFieldErrors(prev => ({ ...prev, pname: '' })); }}
                  placeholder="e.g. iPhone 15 Pro Max"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }}
                />
                {fieldErrors.pname && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.pname}</div>}
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
                  Brand <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <select
                  className={`glass-input ${fieldErrors.bname ? 'border-danger' : ''}`}
                  value={bname}
                  onChange={e => { setBname(e.target.value); setFieldErrors(prev => ({ ...prev, bname: '' })); }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => (
                    <option key={b.ID} value={b.BrandName}>{b.BrandName}</option>
                  ))}
                </select>
                {fieldErrors.bname && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.bname}</div>}
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
                  Category <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <select
                  className={`glass-input ${fieldErrors.cname ? 'border-danger' : ''}`}
                  value={cname}
                  onChange={e => { setCname(e.target.value); setFieldErrors(prev => ({ ...prev, cname: '' })); }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.ID} value={c.CategoryName}>{c.CategoryName}</option>
                  ))}
                </select>
                {fieldErrors.cname && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.cname}</div>}
              </div>
            </div>

            {/* Model & Price */}
            <div className="row g-3">
              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Model Number *</label>
                <input
                  type="text"
                  className={`glass-input ${fieldErrors.modelno ? 'border-danger' : ''}`}
                  value={modelno}
                  onChange={e => { setModelno(e.target.value); setFieldErrors(prev => ({ ...prev, modelno: '' })); }}
                  placeholder="e.g. A3106"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }}
                />
                {fieldErrors.modelno && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.modelno}</div>}
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Selling Price (LKR) *</label>
                <input
                  type="number"
                  min="10000"
                  className={`glass-input ${fieldErrors.price ? 'border-danger' : ''}`}
                  value={price}
                  onChange={e => { setPrice(e.target.value); setFieldErrors(prev => ({ ...prev, price: '' })); }}
                  placeholder="min 10,000 LKR"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }}
                />
                {fieldErrors.price && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.price}</div>}
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Product Color *</label>
                <input
                  type="text"
                  className={`glass-input ${fieldErrors.color ? 'border-danger' : ''}`}
                  value={color}
                  onChange={e => { setColor(e.target.value); setFieldErrors(prev => ({ ...prev, color: '' })); }}
                  placeholder="e.g. Natural Titanium"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }}
                />
                {fieldErrors.color && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.color}</div>}
              </div>
            </div>

            {/* Memory & Specs */}
            <div className="row g-3">
              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>RAM *</label>
                <select className={`glass-input ${fieldErrors.ram ? 'border-danger' : ''}`} value={ram} onChange={e => { setRam(e.target.value); setFieldErrors(prev => ({ ...prev, ram: '' })); }} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">Select RAM</option>
                  {['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {fieldErrors.ram && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.ram}</div>}
              </div>
              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Storage (ROM) *</label>
                <select className={`glass-input ${fieldErrors.rom ? 'border-danger' : ''}`} value={rom} onChange={e => { setRom(e.target.value); setFieldErrors(prev => ({ ...prev, rom: '' })); }} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">Select ROM</option>
                  {['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'].map(ro => <option key={ro} value={ro}>{ro}</option>)}
                </select>
                {fieldErrors.rom && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.rom}</div>}
              </div>
              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Front Camera *</label>
                <input type="text" className={`glass-input ${fieldErrors.fcamera ? 'border-danger' : ''}`} value={fcamera} onChange={e => { setFcamera(e.target.value); setFieldErrors(prev => ({ ...prev, fcamera: '' })); }} placeholder="e.g. 12MP TrueDepth" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
                {fieldErrors.fcamera && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.fcamera}</div>}
              </div>
              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Processor *</label>
                <input type="text" className={`glass-input ${fieldErrors.processor ? 'border-danger' : ''}`} value={processor} onChange={e => { setProcessor(e.target.value); setFieldErrors(prev => ({ ...prev, processor: '' })); }} placeholder="e.g. A17 Pro Bionic" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
                {fieldErrors.processor && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.processor}</div>}
              </div>
            </div>

            {/* Display & SIM Type */}
            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Display *</label>
                <input type="text" className={`glass-input ${fieldErrors.display ? 'border-danger' : ''}`} value={display} onChange={e => { setDisplay(e.target.value); setFieldErrors(prev => ({ ...prev, display: '' })); }} placeholder="e.g. 6.7-inch Super Retina XDR" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
                {fieldErrors.display && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.display}</div>}
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>SIM Support Type *</label>
                <select className={`glass-input ${fieldErrors.simtype ? 'border-danger' : ''}`} value={simtype} onChange={e => { setSimtype(e.target.value); setFieldErrors(prev => ({ ...prev, simtype: '' })); }} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">Select SIM Support...</option>
                  {['Single SIM', 'Dual SIM', 'eSIM', 'Dual SIM (Nano-SIM + eSIM)'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {fieldErrors.simtype && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.simtype}</div>}
              </div>
            </div>

            {/* Tablet Checkbox */}
            {isTablet && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="tabletSim" checked={tabletHasSim} onChange={e => setTabletHasSim(e.target.checked)} />
                <label htmlFor="tabletSim" style={{ fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer', margin: 0 }}>
                  This Tablet has SIM / Cellular Support
                </label>
              </div>
            )}

            {/* IMEI Registration Panel */}
            {showSimAndImei && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', marginTop: '6px' }}>
                <h6 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} /> IMEI Registration ({simtype || 'SIM Support'})
                </h6>
                <div className="row g-3">
                  <div className={isDualSim ? 'col-md-6' : 'col-md-12'}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>IMEI 1 (Primary SIM) *</label>
                    <input type="text" maxLength="15" className={`glass-input ${fieldErrors.imei1 ? 'border-danger' : ''}`} value={imei1} onChange={e => { setImei1(e.target.value); setFieldErrors(prev => ({ ...prev, imei1: '' })); }} placeholder="15-digit IMEI number" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', marginTop: '4px' }} />
                    {fieldErrors.imei1 && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.imei1}</div>}
                  </div>
                  {isDualSim && (
                    <div className="col-md-6">
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>IMEI 2 (Secondary SIM) *</label>
                      <input type="text" maxLength="15" className={`glass-input ${fieldErrors.imei2 ? 'border-danger' : ''}`} value={imei2} onChange={e => { setImei2(e.target.value); setFieldErrors(prev => ({ ...prev, imei2: '' })); }} placeholder="15-digit IMEI number" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', marginTop: '4px' }} />
                      {fieldErrors.imei2 && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.imei2}</div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Features & Specification */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Key Features *</label>
              <textarea className={`glass-input ${fieldErrors.kfeatures ? 'border-danger' : ''}`} rows="2" value={kfeatures} onChange={e => { setKfeatures(e.target.value); setFieldErrors(prev => ({ ...prev, kfeatures: '' })); }} placeholder="Highlight key features..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
              {fieldErrors.kfeatures && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.kfeatures}</div>}
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Technical Specification *</label>
              <textarea className={`glass-input ${fieldErrors.specification ? 'border-danger' : ''}`} rows="2" value={specification} onChange={e => { setSpecification(e.target.value); setFieldErrors(prev => ({ ...prev, specification: '' })); }} placeholder="Detailed specifications..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
              {fieldErrors.specification && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{fieldErrors.specification}</div>}
            </div>

            {/* Active Toggle Switch */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#fff' }}>Publish to Storefront</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Visible to customers browsing the online catalog</p>
              </div>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                <input type="checkbox" checked={status} onChange={e => setStatus(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: status ? 'var(--primary)' : 'rgba(255,255,255,0.2)', transition: '0.3s', borderRadius: '26px' }}>
                  <span style={{ position: 'absolute', content: '""', height: '20px', width: '20px', left: status ? '24px' : '3px', bottom: '3px', backgroundColor: '#fff', transition: '0.3s', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}></span>
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="submit" disabled={submitting} className="glass-btn" style={{ padding: '12px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={18} /> {submitting ? 'Creating...' : 'Add Product'}
              </button>
              <Link to="/admin/manage-product" className="glass-btn-secondary" style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600' }}>Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
