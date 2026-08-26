import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Pencil, CheckCircle, AlertCircle, ArrowLeft, PlusCircle, 
  Save, Trash2, Layers, Upload, Check, RefreshCw, Box, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';

export default function EditProduct() {
  const { id } = useParams();
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Parent Product Form State
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

  // Images state
  const [image1, setImage1] = useState('');
  const [image2, setImage2] = useState('');
  const [image3, setImage3] = useState('');

  // Variants state
  const [variants, setVariants] = useState([]);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [vColor, setVColor] = useState('');
  const [vRam, setVRam] = useState('4GB');
  const [vRom, setVRom] = useState('128GB');
  const [vPrice, setVPrice] = useState('10000');
  const [vStock, setVStock] = useState('0');

  // Variant inline edits state: { [varId]: { Price: number, Stock: number } }
  const [variantEdits, setVariantEdits] = useState({});

  // File Inputs Refs
  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const fileInputRef3 = useRef(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [variantErrors, setVariantErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Confirmation modals state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null
  });

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
        setSimtype(data.SimType || 'Single SIM');
        setKfeatures(data.KeyFeature || '');
        setSpecification(data.Specification || '');
        setStatus(String(data.Status) === '1' || data.Status === 1);
        
        setImage1(data.Image1 || 'phone_sample1.jpg');
        setImage2(data.Image2 || 'phone_sample2.jpg');
        setImage3(data.Image3 || 'phone_sample3.jpg');

        const fetchedVariants = data.variants || [];
        setVariants(fetchedVariants);

        // Initialize variant inline edit state
        const initialEdits = {};
        fetchedVariants.forEach(v => {
          initialEdits[v.ID] = {
            Price: v.originalPrice || v.Price || 10000,
            Stock: v.Stock || 0
          };
        });
        setVariantEdits(initialEdits);

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

  // Color translation helper for preview dot
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

  // ── 1. Handle General Info Submit Attempt ──
  const handleUpdateGeneralAttempt = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const errors = {};

    const pattern = /^[a-zA-Z0-9\s\/]+$/;

    if (!pname.trim()) {
      errors.pname = 'Please enter the product name.';
    } else if (!pattern.test(pname.trim())) {
      errors.pname = 'Product Name cannot contain special characters, plus, minus, or decimals.';
    } else if (!/[a-zA-Z]/.test(pname.trim())) {
      errors.pname = 'Product Name must contain at least one letter.';
    }

    if (!bname) errors.bname = 'Please select a brand.';
    if (!cname) errors.cname = 'Please select a category.';

    if (!modelno.trim()) {
      errors.modelno = 'Please enter the model number.';
    } else if (!pattern.test(modelno.trim())) {
      errors.modelno = 'Model Number cannot contain special characters, plus, minus, or decimals.';
    }

    if (fcamera.trim() && !pattern.test(fcamera.trim())) {
      errors.fcamera = 'Front Camera cannot contain special characters, plus, minus, or decimals.';
    }

    if (processor.trim() && !pattern.test(processor.trim())) {
      errors.processor = 'Processor cannot contain special characters, plus, minus, or decimals.';
    }

    if (display.trim() && !pattern.test(display.trim())) {
      errors.display = 'Display cannot contain special characters, plus, minus, or decimals.';
    }

    if (cname !== 'Tablet' && (!simtype || simtype === 'None')) {
      errors.simtype = 'Please select a valid SIM Support type for Smartphone.';
    }

    if (!kfeatures.trim()) errors.kfeatures = 'Please enter key features.';
    if (!specification.trim()) errors.specification = 'Please enter specifications.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg('Please fix the highlighted errors before saving changes.');
      return;
    }

    setFieldErrors({});
    setConfirmState({
      isOpen: true,
      title: 'Confirm Product Update',
      message: `Are you sure you want to save changes to general information for "${pname.trim()}"?`,
      action: executeUpdateGeneral
    });
  };

  const executeUpdateGeneral = async () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
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
          pname: pname.trim(),
          bname: bname,
          cname: cname,
          modelno: modelno.trim(),
          simtype: simtype,
          display: display.trim(),
          processor: processor.trim(),
          fcamera: fcamera.trim(),
          kfeatures: kfeatures.trim(),
          specification: specification.trim(),
          status: status ? 1 : 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Product general details updated successfully!');
      } else {
        setErrorMsg(data.message || 'Failed to update product details.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 2. Handle Image Upload / Change ──
  const handleImageFileChange = async (e, imageSlot) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name;
    const ext = fileName.split('.').pop().toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif'];

    if (!allowedExts.includes(ext)) {
      setErrorMsg(`Invalid file format (.${ext}). Only JPG, PNG, and GIF image files are allowed.`);
      e.target.value = '';
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_URL}/products/${id}/image/${imageSlot}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageName: fileName })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Product Image ${imageSlot} updated successfully.`);
        if (imageSlot === 1) setImage1(fileName);
        if (imageSlot === 2) setImage2(fileName);
        if (imageSlot === 3) setImage3(fileName);
      } else {
        setErrorMsg(data.message || `Failed to update Image ${imageSlot}.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server error updating image.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 3. Handle Adding New Variant ──
  const handleAddVariantAttempt = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const errors = {};

    if (!vColor.trim()) {
      errors.vColor = 'Variant color is required.';
    } else if (!/^[a-zA-Z\s\-\/]+$/.test(vColor.trim())) {
      errors.vColor = 'Color cannot contain numbers, minus numbers, or special characters.';
    }

    if (!vPrice || isNaN(vPrice) || parseFloat(vPrice) < 10000) {
      errors.vPrice = 'Variant Price must be at least 10000 LKR.';
    }

    if (vStock === '' || isNaN(vStock) || parseInt(vStock) < 0) {
      errors.vStock = 'Initial stock cannot be negative.';
    }

    // Check duplicate color + RAM + ROM
    const isDup = variants.some(
      v => v.Color.toLowerCase() === vColor.trim().toLowerCase() &&
           v.RAM.toLowerCase() === vRam.trim().toLowerCase() &&
           v.ROM.toLowerCase() === vRom.trim().toLowerCase()
    );
    if (isDup) {
      errors.vColor = `Variant combination ("${vColor.trim()}", ${vRam}, ${vRom}) already exists for this product.`;
    }

    if (Object.keys(errors).length > 0) {
      setVariantErrors(errors);
      return;
    }

    setVariantErrors({});
    setConfirmState({
      isOpen: true,
      title: 'Confirm Add Variant',
      message: `Are you sure you want to add variant "${vColor.trim()} - ${vRam} / ${vRom}" to this product?`,
      action: executeAddVariant
    });
  };

  const executeAddVariant = async () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/products/${id}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          v_color: vColor.trim(),
          v_ram: vRam,
          v_rom: vRom,
          v_price: parseFloat(vPrice),
          v_stock: parseInt(vStock)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('New product variant added successfully!');
        setVColor('');
        setShowAddVariant(false);
        fetchProductDetails();
      } else {
        setErrorMsg(data.message || 'Failed to add variant.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server error adding variant.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 4. Handle Inline Edit Variant (Save Row) ──
  const handleSaveVariantRow = (variantId) => {
    const editData = variantEdits[variantId];
    if (!editData) return;

    const price = parseFloat(editData.Price);
    const stock = parseInt(editData.Stock);

    if (isNaN(price) || price < 10000) {
      setErrorMsg('Variant price must be at least 10000 LKR.');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      setErrorMsg('Stock cannot be negative.');
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'Confirm Variant Update',
      message: `Save changes for this variant (Price: LKR ${price.toLocaleString()}, Stock: ${stock} units)?`,
      action: () => executeUpdateVariantRow(variantId, price, stock)
    });
  };

  const executeUpdateVariantRow = async (variantId, price, stock) => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/products/variants/${variantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ v_price: price, v_stock: stock })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Variant updated successfully.');
        fetchProductDetails();
      } else {
        setErrorMsg(data.message || 'Failed to update variant.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server error updating variant row.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 5. Handle Delete Variant ──
  const handleDeleteVariantAttempt = (variant) => {
    if (variant.Stock > 0) {
      setErrorMsg(`Cannot delete variant "${variant.Color}". This variant currently has active stock (${variant.Stock} units) in inventory. Set stock to 0 first.`);
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'Confirm Delete Variant',
      message: `Are you sure you want to delete variant "${variant.Color} (${variant.RAM}/${variant.ROM})"? This action cannot be undone.`,
      action: () => executeDeleteVariant(variant.ID)
    });
  };

  const executeDeleteVariant = async (variantId) => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/products/variants/${variantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Variant deleted successfully.');
        fetchProductDetails();
      } else {
        setErrorMsg(data.message || 'Failed to delete variant.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server error deleting variant.');
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
            }}>Inventory Catalog</span>
            <h2 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: '#ffffff', fontSize: '26px' }}>
              <Pencil style={{ color: '#818cf8' }} size={28} /> Update Product Information
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

        {/* Global Notifications */}
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
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.action}
          onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        />

        {loading ? (
          <div className="glass-card p-5 text-center" style={{ borderRadius: '20px', background: 'rgba(15, 23, 42, 0.85)', color: '#94a3b8' }}>
            <RefreshCw size={28} className="animate-spin mb-2 text-primary" />
            <p className="m-0 fw-bold">Loading product details...</p>
          </div>
        ) : (
          <>
            {/* ── Section 1: General Product Details Form ── */}
            <div className="glass-card p-4 mb-4" style={{ borderRadius: '20px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
                <h5 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: '#818cf8', fontSize: '18px' }}>
                  <Box size={20} /> Product General Details
                </h5>
              </div>

              <form noValidate onSubmit={handleUpdateGeneralAttempt}>
                
                {/* Product Name, Brand, Category */}
                <div className="row g-3 mb-3">
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

                  <div className="col-md-3">
                    <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                      Category <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className={`form-select glass-input ${fieldErrors.cname ? 'is-invalid' : ''}`}
                      value={cname}
                      onChange={e => { setCname(e.target.value); setFieldErrors(prev => ({ ...prev, cname: '' })); }}
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

                {/* Model & Specs */}
                <div className="row g-3 mb-3">
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

                  <div className="col-md-6">
                    <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                      SIM Support <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className={`form-select glass-input ${fieldErrors.simtype ? 'is-invalid' : ''}`}
                      value={simtype}
                      onChange={e => { setSimtype(e.target.value); setFieldErrors(prev => ({ ...prev, simtype: '' })); }}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                      required
                    >
                      <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>Select SIM Support Type...</option>
                      {['Single SIM', 'Dual SIM', 'eSIM', 'Dual SIM (Nano-SIM + eSIM)', 'None'].map(opt => (
                        <option key={opt} value={opt} style={{ background: '#0f172a', color: '#f8fafc' }}>{opt}</option>
                      ))}
                    </select>
                    {fieldErrors.simtype && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.simtype}</div>}
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                      Front Camera
                    </label>
                    <input
                      type="text"
                      className={`form-control glass-input ${fieldErrors.fcamera ? 'is-invalid' : ''}`}
                      value={fcamera}
                      onChange={e => setFcamera(e.target.value)}
                      placeholder="e.g. 12MP TrueDepth"
                      style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                    />
                    {fieldErrors.fcamera && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.fcamera}</div>}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                      Processor
                    </label>
                    <input
                      type="text"
                      className={`form-control glass-input ${fieldErrors.processor ? 'is-invalid' : ''}`}
                      value={processor}
                      onChange={e => setProcessor(e.target.value)}
                      placeholder="e.g. A17 Pro Bionic"
                      style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                    />
                    {fieldErrors.processor && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.processor}</div>}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                      Display
                    </label>
                    <input
                      type="text"
                      className={`form-control glass-input ${fieldErrors.display ? 'is-invalid' : ''}`}
                      value={display}
                      onChange={e => setDisplay(e.target.value)}
                      placeholder="e.g. 6.7-inch Super Retina XDR"
                      style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                    />
                    {fieldErrors.display && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.display}</div>}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                    Key Features <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    className={`form-control glass-input ${fieldErrors.kfeatures ? 'is-invalid' : ''}`}
                    rows="3"
                    value={kfeatures}
                    onChange={e => setKfeatures(e.target.value)}
                    placeholder="Key features..."
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
                    onChange={e => setSpecification(e.target.value)}
                    placeholder="Technical specifications..."
                    style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                    required
                  />
                  {fieldErrors.specification && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{fieldErrors.specification}</div>}
                </div>

                {/* Image Update Cards */}
                <div className="row g-3 mb-4">
                  {/* Image 1 Card */}
                  <div className="col-md-4">
                    <div className="glass-card p-3 text-center" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '14px' }}>
                      <h6 className="fw-bold text-white small mb-2">Image 1 (Main)</h6>
                      <div className="mb-3 d-flex align-items-center justify-content-center" style={{ height: '140px', background: 'rgba(15,23,42,0.6)', borderRadius: '10px', overflow: 'hidden' }}>
                        <img 
                          src={`${API_URL.replace('/api', '')}/uploads/products/${image1}`}
                          onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                          alt="Product Image 1"
                          style={{ maxHeight: '130px', maxWidth: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef1}
                        accept=".jpg,.jpeg,.png,.gif"
                        style={{ display: 'none' }}
                        onChange={e => handleImageFileChange(e, 1)}
                      />
                      <button
                        type="button"
                        className="glass-btn glass-btn-secondary w-100 py-2"
                        onClick={() => fileInputRef1.current && fileInputRef1.current.click()}
                        style={{ fontSize: '12px', borderRadius: '8px' }}
                      >
                        <Upload size={14} /> Change Image 1
                      </button>
                    </div>
                  </div>

                  {/* Image 2 Card */}
                  <div className="col-md-4">
                    <div className="glass-card p-3 text-center" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '14px' }}>
                      <h6 className="fw-bold text-white small mb-2">Image 2</h6>
                      <div className="mb-3 d-flex align-items-center justify-content-center" style={{ height: '140px', background: 'rgba(15,23,42,0.6)', borderRadius: '10px', overflow: 'hidden' }}>
                        <img 
                          src={`${API_URL.replace('/api', '')}/uploads/products/${image2}`}
                          onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                          alt="Product Image 2"
                          style={{ maxHeight: '130px', maxWidth: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef2}
                        accept=".jpg,.jpeg,.png,.gif"
                        style={{ display: 'none' }}
                        onChange={e => handleImageFileChange(e, 2)}
                      />
                      <button
                        type="button"
                        className="glass-btn glass-btn-secondary w-100 py-2"
                        onClick={() => fileInputRef2.current && fileInputRef2.current.click()}
                        style={{ fontSize: '12px', borderRadius: '8px' }}
                      >
                        <Upload size={14} /> Change Image 2
                      </button>
                    </div>
                  </div>

                  {/* Image 3 Card */}
                  <div className="col-md-4">
                    <div className="glass-card p-3 text-center" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '14px' }}>
                      <h6 className="fw-bold text-white small mb-2">Image 3</h6>
                      <div className="mb-3 d-flex align-items-center justify-content-center" style={{ height: '140px', background: 'rgba(15,23,42,0.6)', borderRadius: '10px', overflow: 'hidden' }}>
                        <img 
                          src={`${API_URL.replace('/api', '')}/uploads/products/${image3}`}
                          onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                          alt="Product Image 3"
                          style={{ maxHeight: '130px', maxWidth: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef3}
                        accept=".jpg,.jpeg,.png,.gif"
                        style={{ display: 'none' }}
                        onChange={e => handleImageFileChange(e, 3)}
                      />
                      <button
                        type="button"
                        className="glass-btn glass-btn-secondary w-100 py-2"
                        onClick={() => fileInputRef3.current && fileInputRef3.current.click()}
                        style={{ fontSize: '12px', borderRadius: '8px' }}
                      >
                        <Upload size={14} /> Change Image 3
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Status Checkbox */}
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
                    Active Status (Visible on Storefront)
                  </label>
                </div>

                {/* Save General Info Button */}
                <div className="d-flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="glass-btn glass-btn-primary px-4 py-2"
                    style={{ borderRadius: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {submitting ? 'Saving...' : 'Save General Info'}
                  </button>
                </div>

              </form>
            </div>

            {/* ── Section 2: Product Variants Management Section ── */}
            <div className="glass-card p-4" style={{ borderRadius: '20px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary flex-wrap gap-2">
                <h5 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: '#818cf8', fontSize: '18px' }}>
                  <Layers size={20} /> Product Variants Management
                </h5>
                <button
                  type="button"
                  className="glass-btn glass-btn-primary py-1 px-3"
                  onClick={() => setShowAddVariant(!showAddVariant)}
                  style={{ borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <PlusCircle size={14} /> {showAddVariant ? 'Hide Add Variant Form' : 'Add New Variant'}
                </button>
              </div>

              {/* Add Variant Collapsible Form */}
              {showAddVariant && (
                <div className="glass-card p-4 mb-4" style={{ borderRadius: '16px', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                  <h6 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
                    <PlusCircle size={16} /> Add a New Specification Combination
                  </h6>

                  <form noValidate onSubmit={handleAddVariantAttempt}>
                    <div className="row g-3 align-items-end">
                      {/* Color */}
                      <div className="col-md-3">
                        <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '12px' }}>
                          Color <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text" style={{ background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '6px 10px' }}>
                            <div style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              backgroundColor: getCssColor(vColor),
                              border: '1px solid rgba(255,255,255,0.5)'
                            }} />
                          </span>
                          <input
                            type="text"
                            className={`form-control glass-input ${variantErrors.vColor ? 'is-invalid' : ''}`}
                            value={vColor}
                            onChange={e => { setVColor(e.target.value); setVariantErrors(prev => ({ ...prev, vColor: '' })); }}
                            placeholder="e.g. Titanium Black"
                            style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#f8fafc', fontSize: '13px' }}
                            required
                          />
                        </div>
                        {variantErrors.vColor && <div style={{ color: '#f87171', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>{variantErrors.vColor}</div>}
                      </div>

                      {/* RAM */}
                      <div className="col-md-2">
                        <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '12px' }}>
                          RAM <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          className="form-select glass-input"
                          value={vRam}
                          onChange={e => setVRam(e.target.value)}
                          style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#f8fafc', fontSize: '13px' }}
                        >
                          <option value="None" style={{ background: '#0f172a', color: '#f8fafc' }}>None</option>
                          {['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'].map(r => (
                            <option key={r} value={r} style={{ background: '#0f172a', color: '#f8fafc' }}>{r}</option>
                          ))}
                        </select>
                      </div>

                      {/* ROM */}
                      <div className="col-md-2">
                        <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '12px' }}>
                          Storage (ROM) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          className="form-select glass-input"
                          value={vRom}
                          onChange={e => setVRom(e.target.value)}
                          style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#f8fafc', fontSize: '13px' }}
                        >
                          <option value="None" style={{ background: '#0f172a', color: '#f8fafc' }}>None</option>
                          {['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'].map(ro => (
                            <option key={ro} value={ro} style={{ background: '#0f172a', color: '#f8fafc' }}>{ro}</option>
                          ))}
                        </select>
                      </div>

                      {/* Price */}
                      <div className="col-md-3">
                        <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '12px' }}>
                          Price (LKR) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="number"
                          min="10000"
                          step="1"
                          className={`form-control glass-input ${variantErrors.vPrice ? 'is-invalid' : ''}`}
                          value={vPrice}
                          onChange={e => { setVPrice(e.target.value); setVariantErrors(prev => ({ ...prev, vPrice: '' })); }}
                          placeholder="0"
                          style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#f8fafc', fontSize: '13px' }}
                          required
                        />
                        {variantErrors.vPrice && <div style={{ color: '#f87171', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>{variantErrors.vPrice}</div>}
                      </div>

                      {/* Initial Stock */}
                      <div className="col-md-2">
                        <label className="form-label fw-bold mb-1" style={{ color: '#cbd5e1', fontSize: '12px' }}>
                          Initial Stock <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          className={`form-control glass-input ${variantErrors.vStock ? 'is-invalid' : ''}`}
                          value={vStock}
                          onChange={e => { setVStock(e.target.value); setVariantErrors(prev => ({ ...prev, vStock: '' })); }}
                          style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#f8fafc', fontSize: '13px' }}
                          required
                        />
                        {variantErrors.vStock && <div style={{ color: '#f87171', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>{variantErrors.vStock}</div>}
                      </div>
                    </div>

                    <div className="mt-3 text-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="glass-btn glass-btn-primary px-4 py-2"
                        style={{ borderRadius: '10px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <CheckCircle size={15} /> Save Variant
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Registered Variants Table */}
              <div className="table-responsive" style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="table table-dark table-hover align-middle m-0" style={{ background: 'transparent', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px 16px' }}>Color</th>
                      <th style={{ padding: '12px 16px' }}>RAM</th>
                      <th style={{ padding: '12px 16px' }}>Storage (ROM)</th>
                      <th style={{ padding: '12px 16px' }}>Price (LKR)</th>
                      <th style={{ padding: '12px 16px' }}>Stock Units</th>
                      <th style={{ padding: '12px 16px' }} className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          No variants registered yet. Click "Add New Variant" above to add one.
                        </td>
                      </tr>
                    ) : (
                      variants.map(v => {
                        const editItem = variantEdits[v.ID] || { Price: v.originalPrice || v.Price || 10000, Stock: v.Stock || 0 };
                        return (
                          <tr key={v.ID} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {/* Color Dot + Name */}
                            <td style={{ padding: '12px 16px' }}>
                              <div className="d-flex align-items-center gap-2">
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  backgroundColor: getCssColor(v.Color),
                                  border: '1px solid rgba(255,255,255,0.5)',
                                  flexShrink: 0
                                }} />
                                <strong style={{ color: '#ffffff' }}>{v.Color}</strong>
                              </div>
                            </td>

                            {/* RAM */}
                            <td style={{ padding: '12px 16px' }}>
                              <span className="badge px-2 py-1" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: '8px', fontSize: '11px' }}>
                                {v.RAM}
                              </span>
                            </td>

                            {/* ROM */}
                            <td style={{ padding: '12px 16px' }}>
                              <span className="badge px-2 py-1" style={{ background: 'rgba(255,255,255,0.1)', color: '#f8fafc', borderRadius: '8px', fontSize: '11px' }}>
                                {v.ROM}
                              </span>
                            </td>

                            {/* Inline Price Edit */}
                            <td style={{ padding: '12px 16px' }}>
                              <input
                                type="number"
                                min="10000"
                                step="1"
                                className="form-control glass-input form-control-sm"
                                value={editItem.Price}
                                onChange={e => {
                                  const val = e.target.value;
                                  setVariantEdits(prev => ({
                                    ...prev,
                                    [v.ID]: { ...prev[v.ID], Price: val }
                                  }));
                                }}
                                style={{ width: '130px', background: 'rgba(15,23,42,0.8)', color: '#38bdf8', fontWeight: '600', fontSize: '13px' }}
                              />
                            </td>

                            {/* Inline Stock Edit */}
                            <td style={{ padding: '12px 16px' }}>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                className="form-control glass-input form-control-sm"
                                value={editItem.Stock}
                                onChange={e => {
                                  const val = e.target.value;
                                  setVariantEdits(prev => ({
                                    ...prev,
                                    [v.ID]: { ...prev[v.ID], Stock: val }
                                  }));
                                }}
                                style={{ width: '90px', background: 'rgba(15,23,42,0.8)', color: '#34d399', fontWeight: '700', fontSize: '13px' }}
                              />
                            </td>

                            {/* Save Row & Delete Variant */}
                            <td style={{ padding: '12px 16px' }} className="text-center">
                              <div className="d-flex justify-content-center gap-2">
                                <button
                                  type="button"
                                  className="glass-btn glass-btn-primary py-1 px-3"
                                  onClick={() => handleSaveVariantRow(v.ID)}
                                  style={{ borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  title="Save Row Changes"
                                >
                                  <Save size={14} /> Save
                                </button>
                                <button
                                  type="button"
                                  className="glass-btn glass-btn-danger py-1 px-3"
                                  onClick={() => handleDeleteVariantAttempt(v)}
                                  style={{ borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  title="Delete Variant"
                                >
                                  <Trash2 size={14} /> Delete
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
          </>
        )}

      </div>
    </AdminLayout>
  );
}
