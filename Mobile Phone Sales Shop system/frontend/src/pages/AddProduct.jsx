import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Box, CheckCircle, AlertCircle, ArrowLeft, PlusCircle, 
  ShieldCheck, Hash, Upload, Check, RefreshCw 
} from 'lucide-react';
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

  // Image File States
  const [image1, setImage1] = useState('');
  const [image2, setImage2] = useState('');
  const [image3, setImage3] = useState('');

  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const fileInputRef3 = useRef(null);

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
      console.error('Error fetching brands/categories:', err);
    }
  };

  const isDualSim = simtype.toLowerCase().includes('dual');
  const isTablet = cname === 'Tablet';
  const showSimAndImei = !isTablet || (isTablet && tabletHasSim);

  // Popular phone color translation helper
  const getCssColor = (name) => {
    if (!name) return '#64748b';
    const trimmed = name.trim().toLowerCase();
    const phoneColors = {
      'titanium': '#8e8e93',
      'natural titanium': '#a8a7a0',
      'blue titanium': '#2f4452',
      'white titanium': '#f2f1ed',
      'black titanium': '#3c3d3a',
      'titanium gray': '#70706e',
      'titanium grey': '#70706e',
      'space gray': '#555559',
      'space grey': '#555559',
      'space black': '#1c1c1e',
      'silver': '#e3e4e5',
      'gold': '#fad7a0',
      'rose gold': '#fadbd8',
      'midnight': '#191f28',
      'starlight': '#f0eae3',
      'flowy emerald': '#5f8575',
      'mint': '#dfffed',
      'bora purple': '#8e82a0',
      'bay blue': '#4f94cd',
      'awesome violet': '#b19cd9',
      'mint green': '#a2e8dd'
    };
    return phoneColors[trimmed] || trimmed;
  };

  // Custom File Change Handler with Extension Check
  const handleFileChange = (e, setImageFn, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      const fileName = file.name;
      const ext = fileName.split('.').pop().toLowerCase();
      const allowedExts = ['jpg', 'jpeg', 'png', 'gif'];

      if (!allowedExts.includes(ext)) {
        setFieldErrors(prev => ({
          ...prev,
          [fieldName]: `Invalid file format (.${ext}). Only JPG, PNG, and GIF image files are permitted.`
        }));
        e.target.value = '';
        setImageFn('');
        return;
      }

      setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
      setImageFn(fileName);
    }
  };

  const handleSubmitAttempt = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const errors = {};

    const pattern = /^[a-zA-Z0-9\s\/]+$/;

    // 1. Product Name Validation
    if (!pname.trim()) {
      errors.pname = 'Please enter the product name.';
    } else if (!pattern.test(pname.trim())) {
      errors.pname = 'Product Name cannot contain special characters, plus, minus, or decimals.';
    } else if (!/[a-zA-Z]/.test(pname.trim())) {
      errors.pname = 'Product Name must contain at least one letter.';
    }

    // 2. Brand & Category Validation
    if (!bname) errors.bname = 'Please select a brand.';
    if (!cname) errors.cname = 'Please select a category.';

    // 3. Model Number Validation
    if (!modelno.trim()) {
      errors.modelno = 'Please enter the model number.';
    } else if (!pattern.test(modelno.trim())) {
      errors.modelno = 'Model Number cannot contain special characters, plus, minus, or decimals.';
    }

    // 4. Selling Price Validation
    if (!price || isNaN(price) || parseFloat(price) < 10000) {
      errors.price = 'Selling Price must be at least 10000 LKR.';
    }

    // 5. Color Validation
    if (!color.trim()) {
      errors.color = 'Please provide product color.';
    } else if (!/^[a-zA-Z\s\-\/]+$/.test(color.trim())) {
      errors.color = 'Color cannot contain numbers, minus numbers, or special characters.';
    }

    // 6. RAM & ROM Validation
    const validRams = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'];
    const validRoms = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];

    if (!ram || !validRams.includes(ram)) errors.ram = 'Please select a valid RAM option.';
    if (!rom || !validRoms.includes(rom)) errors.rom = 'Please select a valid ROM option.';

    // 7. Hardware Specs Validation
    if (!fcamera.trim()) {
      errors.fcamera = 'Please enter the front camera details.';
    } else if (!pattern.test(fcamera.trim())) {
      errors.fcamera = 'Front Camera cannot contain special characters, plus, minus, or decimals.';
    }

    if (!processor.trim()) {
      errors.processor = 'Please enter the processor details.';
    } else if (!pattern.test(processor.trim())) {
      errors.processor = 'Processor cannot contain special characters, plus, minus, or decimals.';
    }

    if (!display.trim()) {
      errors.display = 'Please enter the display details.';
    } else if (!pattern.test(display.trim())) {
      errors.display = 'Display cannot contain special characters, plus, minus, or decimals.';
    }

    // 8. Tablet Serial Number & SIM Rules
    if (isTablet) {
      if (!serialNo.trim()) {
        errors.serialNo = 'Serial Number is required for Tablet devices.';
      }
    }

    if (showSimAndImei) {
      if (!simtype) errors.simtype = 'Please select SIM Support type.';
      if (!imei1.trim() || imei1.trim().length !== 15 || !/^\d{15}$/.test(imei1.trim())) {
        errors.imei1 = 'IMEI 1 must be exactly 15 numeric digits.';
      }
      if (isDualSim) {
        if (!imei2.trim() || imei2.trim().length !== 15 || !/^\d{15}$/.test(imei2.trim())) {
          errors.imei2 = 'IMEI 2 must be exactly 15 numeric digits for Dual SIM devices.';
        } else if (imei1.trim() === imei2.trim()) {
          errors.imei2 = 'IMEI 1 and IMEI 2 cannot be identical.';
        }
      }
    }

    // 9. Key Features & Specification
    if (!kfeatures.trim()) errors.kfeatures = 'Please enter key features.';
    if (!specification.trim()) errors.specification = 'Please enter specifications.';

    // 10. Image Validation
    if (!image1) errors.image1 = 'Image 1 (Main) is required.';
    if (!image2) errors.image2 = 'Image 2 is required.';
    if (!image3) errors.image3 = 'Image 3 is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg('Please fix the highlighted form errors before proceeding.');
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
          pname: pname.trim(),
          bname: bname,
          cname: cname,
          modelno: modelno.trim(),
          price: parseFloat(price),
          color: color.trim(),
          ram: ram,
          rom: rom,
          fcamera: fcamera.trim(),
          processor: processor.trim(),
          display: display.trim(),
          simtype: showSimAndImei ? simtype : 'None',
          serial_no: serialNo.trim(),
          tablet_has_sim: tabletHasSim,
          imei1: imei1.trim(),
          imei2: imei2.trim(),
          kfeatures: kfeatures.trim(),
          specification: specification.trim(),
          image1: image1,
          image2: image2,
          image3: image3,
          status: status ? 1 : 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Product "${pname.trim()}" created successfully with initial stock & batch record.`);
        setTimeout(() => navigate('/admin/manage-product'), 1200);
      } else {
        setErrorMsg(data.message || 'Failed to create product.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server connection failure. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1050px' }}>
        
        {/* Top Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#38bdf8',
              background: 'rgba(56,189,248,0.12)',
              padding: '4px 12px',
              borderRadius: '20px',
              display: 'inline-block',
              marginBottom: '8px'
            }}>Catalog Management</span>
            <h2 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: '#ffffff', fontSize: '26px' }}>
              <Box style={{ color: '#818cf8' }} size={28} /> Add New Product
            </h2>
          </div>
          <Link
            to="/admin/manage-product"
            className="glass-btn glass-btn-secondary"
            style={{ borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> Back to Catalog
          </Link>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="glass-card mb-4" style={{ borderLeft: '4px solid #f87171', background: 'rgba(239, 68, 68, 0.12)', padding: '14px 18px', borderRadius: '12px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} /> <span style={{ fontSize: '14px', fontWeight: '600' }}>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="glass-card mb-4" style={{ borderLeft: '4px solid #4ade80', background: 'rgba(74, 222, 128, 0.12)', padding: '14px 18px', borderRadius: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={20} /> <span style={{ fontSize: '14px', fontWeight: '600' }}>{successMsg}</span>
          </div>
        )}

        <ConfirmModal
          isOpen={showConfirmModal}
          title="Confirm Product Registration"
          message={`Please confirm that you wish to register product "${pname.trim()}" in the catalog.`}
          onConfirm={executeAddProduct}
          onCancel={() => setShowConfirmModal(false)}
        />

        {/* Glass Form Panel */}
        <div className="glass-card p-4" style={{ borderRadius: '20px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <form noValidate onSubmit={handleSubmitAttempt}>
            
            {/* Section 1: Basic Information */}
            <div className="row g-3 mb-3">
              {/* Product Name */}
              <div className="col-md-6">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Product Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`form-control glass-input ${fieldErrors.pname ? 'is-invalid' : ''}`}
                  value={pname}
                  onChange={e => { setPname(e.target.value); setFieldErrors(prev => ({ ...prev, pname: '' })); }}
                  placeholder="e.g. iPhone 15 Pro Max"
                  style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  required
                />
                {fieldErrors.pname ? (
                  <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.pname}</div>
                ) : (
                  <div className="form-text small" style={{ color: '#cbd5e1', fontSize: '11px' }}>Alpha-numeric, space, slash allowed. Must contain at least 1 letter.</div>
                )}
              </div>

              {/* Brand */}
              <div className="col-md-3">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Brand <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className={`form-select glass-input ${fieldErrors.bname ? 'is-invalid' : ''}`}
                  value={bname}
                  onChange={e => { setBname(e.target.value); setFieldErrors(prev => ({ ...prev, bname: '' })); }}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  required
                >
                  <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>Select Brand</option>
                  {brands.map(b => (
                    <option key={b.ID} value={b.BrandName} style={{ background: '#0f172a', color: '#f8fafc' }}>
                      {b.BrandName}{b.Status === 0 ? ' (Inactive)' : ''}
                    </option>
                  ))}
                </select>
                {fieldErrors.bname && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.bname}</div>}
              </div>

              {/* Category */}
              <div className="col-md-3">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className={`form-select glass-input ${fieldErrors.cname ? 'is-invalid' : ''}`}
                  value={cname}
                  onChange={e => {
                    const val = e.target.value;
                    setCname(val);
                    setFieldErrors(prev => ({ ...prev, cname: '' }));
                    if (val !== 'Tablet') {
                      setSerialNo('');
                      setTabletHasSim(false);
                    }
                  }}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  required
                >
                  <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>Select Category</option>
                  {categories.map(c => (
                    <option key={c.ID} value={c.CategoryName} style={{ background: '#0f172a', color: '#f8fafc' }}>
                      {c.CategoryName}{c.Status === 0 ? ' (Inactive)' : ''}
                    </option>
                  ))}
                </select>
                {fieldErrors.cname && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.cname}</div>}
              </div>
            </div>

            {/* Section 2: Model & Price */}
            <div className="row g-3 mb-3">
              {/* Model Number */}
              <div className="col-md-6">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Model Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`form-control glass-input ${fieldErrors.modelno ? 'is-invalid' : ''}`}
                  value={modelno}
                  onChange={e => { setModelno(e.target.value); setFieldErrors(prev => ({ ...prev, modelno: '' })); }}
                  placeholder="e.g. A3106"
                  style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  required
                />
                {fieldErrors.modelno && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.modelno}</div>}
              </div>

              {/* Price */}
              <div className="col-md-6">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Price (LKR) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  min="10000"
                  step="1"
                  className={`form-control glass-input ${fieldErrors.price ? 'is-invalid' : ''}`}
                  value={price}
                  onChange={e => { setPrice(e.target.value); setFieldErrors(prev => ({ ...prev, price: '' })); }}
                  placeholder="Minimum 10,000 LKR"
                  style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  required
                />
                {fieldErrors.price && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.price}</div>}
              </div>
            </div>

            {/* Section 3: Product Color */}
            <div className="row g-3 mb-3">
              <div className="col-md-12">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Product Color <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text" style={{ background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: getCssColor(color),
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      transition: 'all 0.3s ease'
                    }} />
                  </span>
                  <input
                    type="text"
                    className={`form-control glass-input ${fieldErrors.color ? 'is-invalid' : ''}`}
                    value={color}
                    onChange={e => { setColor(e.target.value); setFieldErrors(prev => ({ ...prev, color: '' })); }}
                    placeholder="e.g. Titanium Black / Phantom Silver"
                    style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                    required
                  />
                </div>
                {fieldErrors.color ? (
                  <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.color}</div>
                ) : (
                  <div className="form-text small" style={{ color: '#cbd5e1', fontSize: '11px' }}>Enter primary color name (letters, spaces, hyphens, slashes allowed).</div>
                )}
              </div>
            </div>

            {/* Section 4: RAM & ROM */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  RAM <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className={`form-select glass-input ${fieldErrors.ram ? 'is-invalid' : ''}`}
                  value={ram}
                  onChange={e => { setRam(e.target.value); setFieldErrors(prev => ({ ...prev, ram: '' })); }}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  required
                >
                  <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>Select RAM</option>
                  {['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'].map(r => (
                    <option key={r} value={r} style={{ background: '#0f172a', color: '#f8fafc' }}>{r}</option>
                  ))}
                </select>
                {fieldErrors.ram && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.ram}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  ROM <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className={`form-select glass-input ${fieldErrors.rom ? 'is-invalid' : ''}`}
                  value={rom}
                  onChange={e => { setRom(e.target.value); setFieldErrors(prev => ({ ...prev, rom: '' })); }}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  required
                >
                  <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>Select ROM</option>
                  {['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'].map(ro => (
                    <option key={ro} value={ro} style={{ background: '#0f172a', color: '#f8fafc' }}>{ro}</option>
                  ))}
                </select>
                {fieldErrors.rom && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.rom}</div>}
              </div>
            </div>

            {/* Section 5: Specifications */}
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Front Camera <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`form-control glass-input ${fieldErrors.fcamera ? 'is-invalid' : ''}`}
                  value={fcamera}
                  onChange={e => { setFcamera(e.target.value); setFieldErrors(prev => ({ ...prev, fcamera: '' })); }}
                  placeholder="e.g. 12MP TrueDepth"
                  style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  required
                />
                {fieldErrors.fcamera && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.fcamera}</div>}
              </div>

              <div className="col-md-3">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Processor <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`form-control glass-input ${fieldErrors.processor ? 'is-invalid' : ''}`}
                  value={processor}
                  onChange={e => { setProcessor(e.target.value); setFieldErrors(prev => ({ ...prev, processor: '' })); }}
                  placeholder="e.g. A17 Pro Bionic"
                  style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  required
                />
                {fieldErrors.processor && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.processor}</div>}
              </div>

              <div className="col-md-3">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Display <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`form-control glass-input ${fieldErrors.display ? 'is-invalid' : ''}`}
                  value={display}
                  onChange={e => { setDisplay(e.target.value); setFieldErrors(prev => ({ ...prev, display: '' })); }}
                  placeholder="e.g. 6.7-inch Super Retina XDR"
                  style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  required
                />
                {fieldErrors.display && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.display}</div>}
              </div>

              <div className="col-md-3">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  SIM Support {showSimAndImei && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <select
                  className={`form-select glass-input ${fieldErrors.simtype ? 'is-invalid' : ''}`}
                  value={simtype}
                  onChange={e => { setSimtype(e.target.value); setFieldErrors(prev => ({ ...prev, simtype: '' })); }}
                  disabled={isTablet && !tabletHasSim}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  required={showSimAndImei}
                >
                  <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>Select SIM Support...</option>
                  {['Single SIM', 'Dual SIM', 'eSIM', 'Dual SIM (Nano-SIM + eSIM)'].map(opt => (
                    <option key={opt} value={opt} style={{ background: '#0f172a', color: '#f8fafc' }}>{opt}</option>
                  ))}
                </select>
                {fieldErrors.simtype && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.simtype}</div>}
              </div>
            </div>

            {/* Tablet Dynamic Serial Number & SIM Checkbox */}
            {isTablet && (
              <div className="glass-card p-3 mb-3" style={{ border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '14px' }}>
                <div className="row g-3 align-items-center">
                  <div className="col-md-7">
                    <label className="form-label fw-bold small mb-1 d-flex align-items-center gap-1" style={{ color: '#38bdf8' }}>
                      <Hash size={16} /> Serial Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control glass-input ${fieldErrors.serialNo ? 'is-invalid' : ''}`}
                      value={serialNo}
                      onChange={e => { setSerialNo(e.target.value); setFieldErrors(prev => ({ ...prev, serialNo: '' })); }}
                      placeholder="Enter device serial number (e.g. S/N...)"
                      style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                      required
                    />
                    {fieldErrors.serialNo && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.serialNo}</div>}
                  </div>
                  <div className="col-md-5 pt-3">
                    <div className="form-check d-flex align-items-center gap-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="tablet_has_sim"
                        checked={tabletHasSim}
                        onChange={e => setTabletHasSim(e.target.checked)}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                      <label className="form-check-label fw-bold small m-0" htmlFor="tablet_has_sim" style={{ color: '#f8fafc', cursor: 'pointer' }}>
                        This Tablet has SIM / Cellular Support
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Key Features & Specifications */}
            <div className="mb-3">
              <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                Key Features <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className={`form-control glass-input ${fieldErrors.kfeatures ? 'is-invalid' : ''}`}
                rows="3"
                value={kfeatures}
                onChange={e => { setKfeatures(e.target.value); setFieldErrors(prev => ({ ...prev, kfeatures: '' })); }}
                placeholder="Highlight key selling points, camera specs, battery life..."
                style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                required
              />
              {fieldErrors.kfeatures && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.kfeatures}</div>}
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                Specification <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className={`form-control glass-input ${fieldErrors.specification ? 'is-invalid' : ''}`}
                rows="3"
                value={specification}
                onChange={e => { setSpecification(e.target.value); setFieldErrors(prev => ({ ...prev, specification: '' })); }}
                placeholder="Full technical specifications..."
                style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                required
              />
              {fieldErrors.specification && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.specification}</div>}
            </div>

            {/* Section 6: Styled Image File Pickers */}
            <div className="row g-3 mb-4">
              {/* Image 1 (Main) */}
              <div className="col-md-4">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Image 1 (Main) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef1}
                  accept=".jpg,.jpeg,.png,.gif"
                  style={{ display: 'none' }}
                  onChange={e => handleFileChange(e, setImage1, 'image1')}
                />
                <div
                  onClick={() => fileInputRef1.current && fileInputRef1.current.click()}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: fieldErrors.image1 ? '1px solid #ef4444' : '1px dashed rgba(255, 255, 255, 0.25)',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: image1 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    color: image1 ? '#34d399' : '#818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {image1 ? <Check size={20} /> : <Upload size={20} />}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: image1 ? '#f8fafc' : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {image1 ? image1 : 'Choose File...'}
                    </p>
                    <span style={{ fontSize: '11px', color: '#cbd5e1' }}>JPG, PNG, GIF allowed</span>
                  </div>
                </div>
                {fieldErrors.image1 && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>{fieldErrors.image1}</div>}
              </div>

              {/* Image 2 */}
              <div className="col-md-4">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Image 2 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef2}
                  accept=".jpg,.jpeg,.png,.gif"
                  style={{ display: 'none' }}
                  onChange={e => handleFileChange(e, setImage2, 'image2')}
                />
                <div
                  onClick={() => fileInputRef2.current && fileInputRef2.current.click()}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: fieldErrors.image2 ? '1px solid #ef4444' : '1px dashed rgba(255, 255, 255, 0.25)',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: image2 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    color: image2 ? '#34d399' : '#818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {image2 ? <Check size={20} /> : <Upload size={20} />}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: image2 ? '#f8fafc' : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {image2 ? image2 : 'Choose File...'}
                    </p>
                    <span style={{ fontSize: '11px', color: '#cbd5e1' }}>JPG, PNG, GIF allowed</span>
                  </div>
                </div>
                {fieldErrors.image2 && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>{fieldErrors.image2}</div>}
              </div>

              {/* Image 3 */}
              <div className="col-md-4">
                <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Image 3 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef3}
                  accept=".jpg,.jpeg,.png,.gif"
                  style={{ display: 'none' }}
                  onChange={e => handleFileChange(e, setImage3, 'image3')}
                />
                <div
                  onClick={() => fileInputRef3.current && fileInputRef3.current.click()}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: fieldErrors.image3 ? '1px solid #ef4444' : '1px dashed rgba(255, 255, 255, 0.25)',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: image3 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    color: image3 ? '#34d399' : '#818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {image3 ? <Check size={20} /> : <Upload size={20} />}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: image3 ? '#f8fafc' : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {image3 ? image3 : 'Choose File...'}
                    </p>
                    <span style={{ fontSize: '11px', color: '#cbd5e1' }}>JPG, PNG, GIF allowed</span>
                  </div>
                </div>
                {fieldErrors.image3 && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>{fieldErrors.image3}</div>}
              </div>
            </div>

            {/* Section 7: Dynamic IMEI Registration */}
            {showSimAndImei && (
              <div className="glass-card p-4 mb-4" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(15, 23, 42, 0.65)' }}>
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
                  <h6 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
                    <ShieldCheck style={{ color: '#818cf8' }} size={18} /> IMEI Registration
                  </h6>
                  <span className="badge px-3 py-1 rounded-pill" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontSize: '11px', fontWeight: '700' }}>
                    {simtype || 'SIM Support'}
                  </span>
                </div>

                <div className="row g-3">
                  <div className={isDualSim ? 'col-md-6' : 'col-md-12'}>
                    <label className="form-label fw-bold mb-1" style={{ color: '#38bdf8', fontSize: '13px' }}>
                      {isDualSim ? 'IMEI 1 (Primary SIM)' : 'IMEI Number (Single SIM)'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      maxLength="15"
                      className={`form-control glass-input font-monospace ${fieldErrors.imei1 ? 'is-invalid' : ''}`}
                      value={imei1}
                      onChange={e => { setImei1(e.target.value); setFieldErrors(prev => ({ ...prev, imei1: '' })); }}
                      placeholder="Enter 15-digit IMEI number"
                      style={{ background: 'rgba(30, 41, 59, 0.85)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                      required
                    />
                    {fieldErrors.imei1 ? (
                      <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.imei1}</div>
                    ) : (
                      <div className="form-text small" style={{ color: '#cbd5e1', fontSize: '11px' }}>Exactly 15 numeric digits.</div>
                    )}
                  </div>

                  {isDualSim && (
                    <div className="col-md-6">
                      <label className="form-label fw-bold mb-1" style={{ color: '#38bdf8', fontSize: '13px' }}>
                        IMEI 2 (Secondary SIM) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        maxLength="15"
                        className={`form-control glass-input font-monospace ${fieldErrors.imei2 ? 'is-invalid' : ''}`}
                        value={imei2}
                        onChange={e => { setImei2(e.target.value); setFieldErrors(prev => ({ ...prev, imei2: '' })); }}
                        placeholder="Enter 15-digit IMEI 2"
                        style={{ background: 'rgba(30, 41, 59, 0.85)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                        required
                      />
                      {fieldErrors.imei2 ? (
                        <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.imei2}</div>
                      ) : (
                        <div className="form-text small" style={{ color: '#cbd5e1', fontSize: '11px' }}>Exactly 15 numeric digits.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 8: Storefront Status Toggle */}
            <div className="form-check mb-4 d-flex align-items-center gap-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="status"
                checked={status}
                onChange={e => setStatus(e.target.checked)}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <label className="form-check-label fw-bold small m-0" htmlFor="status" style={{ color: '#f8fafc', cursor: 'pointer' }}>
                Publish to Storefront Catalog
              </label>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="glass-btn glass-btn-primary px-4 py-2"
                style={{ borderRadius: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                {submitting ? 'Creating Product...' : 'Add Product'}
              </button>
              <button
                type="button"
                className="glass-btn glass-btn-secondary px-4 py-2"
                onClick={() => {
                  setPname('');
                  setBname('');
                  setCname('');
                  setModelno('');
                  setPrice('');
                  setColor('');
                  setRam('');
                  setRom('');
                  setFcamera('');
                  setProcessor('');
                  setDisplay('');
                  setSimtype('');
                  setSerialNo('');
                  setTabletHasSim(false);
                  setImei1('');
                  setImei2('');
                  setKfeatures('');
                  setSpecification('');
                  setImage1('');
                  setImage2('');
                  setImage3('');
                  setFieldErrors({});
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{ borderRadius: '10px', fontSize: '14px' }}
              >
                Clear Form
              </button>
            </div>

          </form>
        </div>

      </div>
    </AdminLayout>
  );
}
