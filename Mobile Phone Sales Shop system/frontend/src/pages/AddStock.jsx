import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, CheckCircle, AlertCircle, ArrowLeft, PlusCircle, RefreshCw, ShieldCheck, Truck, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';

export default function AddStock() {
  const { token, user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [catalogVariants, setCatalogVariants] = useState([]);

  // Section 1: Batch Info
  const [dealer, setDealer] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchNumber, setBatchNumber] = useState('');

  // Section 2: Product Specs
  const [brand, setBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [color, setColor] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [simtype, setSimtype] = useState('Single SIM');
  const [network, setNetwork] = useState('5G');
  const [productCategory, setProductCategory] = useState('Smartphone');

  // Section 3: Costing & Qty
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Section 4: Serial Nos & IMEIs
  const [serialNos, setSerialNos] = useState(['']);
  const [imeis, setImeis] = useState(['']);

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

    fetchMetadata();
    generateBatch();
  }, [token, user, authLoading]);

  const fetchMetadata = async () => {
    try {
      const [resB, resD, resStock] = await Promise.all([
        fetch(`${API_URL}/products/brands`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/stock/dealers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/stock`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (resB.ok) setBrands(await resB.json());
      if (resD.ok) setDealers(await resD.json());
      if (resStock.ok) setCatalogVariants(await resStock.json());
    } catch (err) {
      console.error(err);
    }
  };

  const generateBatch = async () => {
    try {
      const res = await fetch(`${API_URL}/stock/generate-batch-number`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBatchNumber(data.batchNumber);
      } else {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        setBatchNumber(`BAT-${dateStr}-${randStr}`);
      }
    } catch (err) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      setBatchNumber(`BAT-${dateStr}-${randStr}`);
    }
  };

  // Adjust IMEIs and Serials array based on quantity & SIM type
  useEffect(() => {
    const qty = parseInt(quantity, 10) || 1;
    const isDualSim = simtype.toLowerCase().includes('dual');
    const isTablet = productCategory === 'Tablet';

    // Serials for tablets
    setSerialNos(prev => {
      const arr = [...prev];
      while (arr.length < qty) arr.push('');
      return arr.slice(0, qty);
    });

    // IMEIs count
    let expectedImeis = qty;
    if (isTablet && simtype === 'None') {
      expectedImeis = 0;
    } else if (isDualSim) {
      expectedImeis = qty * 2;
    }

    setImeis(prev => {
      const arr = [...prev];
      while (arr.length < expectedImeis) arr.push('');
      return arr.slice(0, expectedImeis);
    });
  }, [quantity, simtype, productCategory]);

  const handleCatalogSelect = (e) => {
    const varId = e.target.value;
    if (!varId) return;

    const selected = catalogVariants.find(c => String(c.VariantId) === String(varId));
    if (selected) {
      setBrand(selected.BrandName || '');
      setModelName(selected.ProductName || '');
      setColor(selected.Color || '');
      setRam(selected.RAM || '');
      setStorage(selected.ROM || '');
      setSimtype(selected.SimType || 'Single SIM');
      setSellingPrice(selected.Price ? String(selected.Price) : '');
      setProductCategory(selected.CategoryName || 'Smartphone');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const pattern = /^[a-zA-Z0-9\s\/]+$/;
    const colorPattern = /^[a-zA-Z\s\-\/]+$/;

    if (!pattern.test(modelName)) {
      setErrorMsg('Model Name cannot contain special characters, plus, minus, or decimals.');
      return;
    }
    if (!/[a-zA-Z]/.test(modelName)) {
      setErrorMsg('Model Name must contain at least one letter.');
      return;
    }
    if (!colorPattern.test(color)) {
      setErrorMsg('Color cannot contain numbers, minus numbers, or special characters.');
      return;
    }

    const cp = parseFloat(costPrice);
    const sp = parseFloat(sellingPrice);
    if (cp <= 0 || sp <= 0) {
      setErrorMsg('Cost price and selling price must be positive numbers.');
      return;
    }
    if (sp < 10000) {
      setErrorMsg('Selling price must be at least 10,000 LKR.');
      return;
    }
    if (sp <= cp) {
      setErrorMsg(`Selling price (LKR ${sp}) must be greater than Cost price (LKR ${cp}).`);
      return;
    }

    // IMEI validation
    for (let i = 0; i < imeis.length; i++) {
      const im = imeis[i];
      if (im && (!/^\d{15}$/.test(im))) {
        setErrorMsg(`IMEI #${i + 1} ("${im}") is invalid. IMEIs must be exactly 15 numeric digits.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/stock/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          brand,
          model_name: modelName,
          color,
          ram,
          storage,
          simtype,
          network,
          batch_number: batchNumber,
          dealer,
          purchase_date: purchaseDate,
          cost_price: cp,
          selling_price: sp,
          quantity: parseInt(quantity, 10),
          product_category: productCategory,
          serial_nos: serialNos,
          imeis
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || `Batch ${batchNumber} received successfully!`);
        setTimeout(() => navigate('/admin/stock'), 1200);
      } else {
        setErrorMsg(data.message || 'Failed to receive stock batch.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to communicate with server.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDualSim = simtype.toLowerCase().includes('dual');
  const isTablet = productCategory === 'Tablet';

  return (
    <AdminLayout>
      <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1000px' }}>
        {/* Top Header */}
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
            }}>Inventory Control</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Box size={28} className="text-primary" /> Receive New Stock Batch
            </h1>
          </div>
          <Link to="/admin/stock" className="glass-btn-secondary" style={{ borderRadius: '20px', fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Batch Stock List
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Batch & Supplier Info */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.75)' }}>
            <h5 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} /> 1. Batch &amp; Supplier Information
            </h5>
            <div className="row g-3">
              <div className="col-md-5">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Dealer / Supplier *</label>
                <select
                  className="glass-input"
                  value={dealer}
                  onChange={e => setDealer(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px', background: 'rgba(15,23,42,0.9)' }}
                >
                  <option value="">Select Supplier...</option>
                  {dealers.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                  {dealers.length === 0 && (
                    <>
                      <option value="Apex Mobiles Ltd">Apex Mobiles Ltd</option>
                      <option value="Vertex Distribution">Vertex Distribution</option>
                      <option value="Global Cellular Wholesalers">Global Cellular Wholesalers</option>
                    </>
                  )}
                </select>
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Purchase Date *</label>
                <input
                  type="date"
                  className="glass-input"
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px' }}
                />
              </div>

              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Batch Number *</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="text"
                    className="glass-input"
                    value={batchNumber}
                    readOnly
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }}
                  />
                  <button type="button" onClick={generateBatch} className="glass-btn-secondary" style={{ padding: '10px 14px', borderRadius: '10px' }} title="Regenerate Batch Number">
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Catalog Select & Specs */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.75)' }}>
            <h5 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} /> 2. Product &amp; Specification Catalog
            </h5>

            {/* Quick Catalog Select Dropdown */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>Quick Select Existing Product from Catalog</label>
              <select onChange={handleCatalogSelect} className="glass-input" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '6px', background: 'rgba(15,23,42,0.9)' }}>
                <option value="">-- Choose Existing Product Variant from Catalog (Auto-Fills Details Below) --</option>
                {catalogVariants.map(cv => (
                  <option key={cv.VariantId} value={cv.VariantId}>
                    {cv.BrandName} {cv.ProductName} ({cv.Color}, {cv.RAM}/{cv.ROM} — {cv.SimType})
                  </option>
                ))}
              </select>
            </div>

            <div className="row g-3">
              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Brand *</label>
                <select className="glass-input" value={brand} onChange={e => setBrand(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px', background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">Select Brand...</option>
                  {brands.map(b => <option key={b.ID} value={b.BrandName}>{b.BrandName}</option>)}
                </select>
              </div>

              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Model Name *</label>
                <input type="text" className="glass-input" value={modelName} onChange={e => setModelName(e.target.value)} placeholder="e.g. Galaxy S26" required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px' }} />
              </div>

              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Color *</label>
                <input type="text" className="glass-input" value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. Titanium Gray" required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px' }} />
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>RAM *</label>
                <select className="glass-input" value={ram} onChange={e => setRam(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px', background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">Select RAM...</option>
                  {['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Storage (ROM) *</label>
                <select className="glass-input" value={storage} onChange={e => setStorage(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px', background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">Select ROM...</option>
                  {['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'].map(ro => <option key={ro} value={ro}>{ro}</option>)}
                </select>
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>SIM Support Type *</label>
                <select className="glass-input" value={simtype} onChange={e => setSimtype(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px', background: 'rgba(15,23,42,0.9)' }}>
                  {['Single SIM', 'Dual SIM', 'eSIM', 'Dual SIM (Nano-SIM + eSIM)', 'None'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Network Type *</label>
                <select className="glass-input" value={network} onChange={e => setNetwork(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px', background: 'rgba(15,23,42,0.9)' }}>
                  <option value="5G">5G Supported</option>
                  <option value="4G">4G LTE Only</option>
                  <option value="None">None (Wi-Fi Only)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Costing & Pricing */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.75)' }}>
            <h5 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', marginBottom: '16px' }}>
              3. Costing, Pricing &amp; Batch Quantity
            </h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Cost Price (Per Unit LKR) *</label>
                <input type="number" min="1" step="1" className="glass-input" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0" required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px' }} />
              </div>

              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Retail Selling Price (LKR) *</label>
                <input type="number" min="10000" step="1" className="glass-input" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} placeholder="0" required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px' }} />
              </div>

              <div className="col-md-4">
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Received Stock Quantity (Units) *</label>
                <input type="number" min="1" className="glass-input" value={quantity} onChange={e => setQuantity(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', marginTop: '4px', fontWeight: '800', color: '#38bdf8' }} />
              </div>
            </div>
          </div>

          {/* Section 4: Serial / IMEI Register */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.75)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h5 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} /> 4. Serial Number / IMEI Register (Individual Unit Entry)
              </h5>
              <span style={{ fontSize: '11px', background: 'rgba(99,102,241,0.12)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                {quantity} Unit(s)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.from({ length: parseInt(quantity, 10) || 1 }).map((_, uIdx) => (
                <div key={uIdx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8', marginBottom: '8px' }}>
                    Unit #{uIdx + 1}
                  </div>
                  <div className="row g-2">
                    {isTablet && (
                      <div className="col-md-6">
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Serial Number *</label>
                        <input
                          type="text"
                          className="glass-input"
                          value={serialNos[uIdx] || ''}
                          onChange={e => {
                            const updated = [...serialNos];
                            updated[uIdx] = e.target.value;
                            setSerialNos(updated);
                          }}
                          placeholder="e.g. SN10009281"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginTop: '2px' }}
                        />
                      </div>
                    )}

                    {(!isTablet || simtype !== 'None') && (
                      <div className={isDualSim ? 'col-md-6' : 'col-md-12'}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>IMEI 1 (Primary) *</label>
                        <input
                          type="text"
                          maxLength="15"
                          className="glass-input"
                          value={imeis[isDualSim ? uIdx * 2 : uIdx] || ''}
                          onChange={e => {
                            const updated = [...imeis];
                            updated[isDualSim ? uIdx * 2 : uIdx] = e.target.value;
                            setImeis(updated);
                          }}
                          placeholder="15-digit numeric IMEI"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginTop: '2px' }}
                        />
                      </div>
                    )}

                    {isDualSim && (
                      <div className="col-md-6">
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>IMEI 2 (Secondary) *</label>
                        <input
                          type="text"
                          maxLength="15"
                          className="glass-input"
                          value={imeis[uIdx * 2 + 1] || ''}
                          onChange={e => {
                            const updated = [...imeis];
                            updated[uIdx * 2 + 1] = e.target.value;
                            setImeis(updated);
                          }}
                          placeholder="15-digit numeric IMEI"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginTop: '2px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Action */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" disabled={submitting} className="glass-btn" style={{ padding: '14px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={18} /> {submitting ? 'Processing Batch...' : 'Receive & Save Batch'}
            </button>
            <Link to="/admin/stock" className="glass-btn-secondary" style={{ padding: '14px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
