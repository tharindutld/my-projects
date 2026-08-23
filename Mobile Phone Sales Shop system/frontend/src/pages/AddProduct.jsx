import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Smartphone, CheckCircle, AlertCircle, ArrowLeft, PlusCircle, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';

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
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const pattern = /^[a-zA-Z0-9\s\/]+$/;

    if (!pattern.test(pname)) {
      setErrorMsg('Product Name cannot contain special characters, plus, minus, or decimals.');
      return;
    }
    if (!/[a-zA-Z]/.test(pname)) {
      setErrorMsg('Product Name must contain at least one letter.');
      return;
    }
    if (!pattern.test(modelno)) {
      setErrorMsg('Model Number cannot contain special characters, plus, minus, or decimals.');
      return;
    }
    if (parseFloat(price) < 10000) {
      setErrorMsg('Selling Price must be at least 10,000 LKR.');
      return;
    }
    if (showSimAndImei) {
      if (!imei1 || imei1.length !== 15 || !/^\d{15}$/.test(imei1)) {
        setErrorMsg('IMEI 1 must be exactly 15 numeric digits.');
        return;
      }
      if (isDualSim) {
        if (!imei2 || imei2.length !== 15 || !/^\d{15}$/.test(imei2)) {
          setErrorMsg('IMEI 2 must be exactly 15 numeric digits for Dual SIM devices.');
          return;
        }
        if (imei1 === imei2) {
          setErrorMsg('IMEI 1 and IMEI 2 cannot be identical.');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ProductName: pname,
          BrandName: bname,
          CategoryName: cname,
          ModelNumber: modelno,
          Price: parseFloat(price),
          SimType: showSimAndImei ? simtype : 'None',
          Display: display,
          Processor: processor,
          FrontCamera: fcamera,
          KeyFeature: kfeatures,
          Specification: specification,
          Image1: image1,
          Image2: image2,
          Image3: image3,
          Status: status ? 1 : 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Product "${pname}" created successfully.`);
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
              borderRadius: '12px'
            }}>Inventory Catalog</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
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

        {/* Glass Form Panel */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.75)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* General Info Row */}
            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
                  Product Name <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={pname}
                  onChange={e => setPname(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro Max"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }}
                />
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
                  Brand <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <select
                  className="glass-input"
                  value={bname}
                  onChange={e => setBname(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => (
                    <option key={b.ID} value={b.BrandName}>{b.BrandName}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
                  Category <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <select
                  className="glass-input"
                  value={cname}
                  onChange={e => setCname(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.ID} value={c.CategoryName}>{c.CategoryName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Model & Price */}
            <div className="row g-3">
              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Model Number *</label>
                <input
                  type="text"
                  className="glass-input"
                  value={modelno}
                  onChange={e => setModelno(e.target.value)}
                  placeholder="e.g. A3106"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }}
                />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Selling Price (LKR) *</label>
                <input
                  type="number"
                  min="10000"
                  className="glass-input"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="min 10,000 LKR"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }}
                />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Product Color *</label>
                <input
                  type="text"
                  className="glass-input"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  placeholder="e.g. Natural Titanium"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }}
                />
              </div>
            </div>

            {/* Memory & Specs */}
            <div className="row g-3">
              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>RAM *</label>
                <select className="glass-input" value={ram} onChange={e => setRam(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">Select RAM</option>
                  {['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Storage (ROM) *</label>
                <select className="glass-input" value={rom} onChange={e => setRom(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">Select ROM</option>
                  {['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'].map(ro => <option key={ro} value={ro}>{ro}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Front Camera *</label>
                <input type="text" className="glass-input" value={fcamera} onChange={e => setFcamera(e.target.value)} placeholder="e.g. 12MP TrueDepth" required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
              </div>
              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Processor *</label>
                <input type="text" className="glass-input" value={processor} onChange={e => setProcessor(e.target.value)} placeholder="e.g. A17 Pro Bionic" required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
              </div>
            </div>

            {/* Display & SIM Type */}
            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Display *</label>
                <input type="text" className="glass-input" value={display} onChange={e => setDisplay(e.target.value)} placeholder="e.g. 6.7-inch Super Retina XDR" required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>SIM Support Type *</label>
                <select className="glass-input" value={simtype} onChange={e => setSimtype(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">Select SIM Support...</option>
                  {['Single SIM', 'Dual SIM', 'eSIM', 'Dual SIM (Nano-SIM + eSIM)'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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
                    <input type="text" maxLength="15" className="glass-input" value={imei1} onChange={e => setImei1(e.target.value)} placeholder="15-digit IMEI number" required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', marginTop: '4px' }} />
                  </div>
                  {isDualSim && (
                    <div className="col-md-6">
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>IMEI 2 (Secondary SIM) *</label>
                      <input type="text" maxLength="15" className="glass-input" value={imei2} onChange={e => setImei2(e.target.value)} placeholder="15-digit IMEI number" required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', marginTop: '4px' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Features & Specification */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Key Features *</label>
              <textarea className="glass-input" rows="2" value={kfeatures} onChange={e => setKfeatures(e.target.value)} placeholder="Highlight key features..." required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Technical Specification *</label>
              <textarea className="glass-input" rows="2" value={specification} onChange={e => setSpecification(e.target.value)} placeholder="Detailed specifications..." required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px' }} />
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
