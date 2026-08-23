import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminStock() {
  const { token, API_URL } = useAuth();
  const navigate = useNavigate();

  // Dealers
  const [dealers, setDealers] = useState([]);
  
  // Form Fields
  const [brand, setBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [color, setColor] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [screenSize, setScreenSize] = useState('');
  const [simType, setSimType] = useState('Single SIM');
  const [batchNumber, setBatchNumber] = useState('');
  const [dealer, setDealer] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [productCategory, setProductCategory] = useState('Smartphone');
  
  // Serial / IMEI lists
  const [serialNos, setSerialNos] = useState([]);
  const [imeis, setImeis] = useState([]);

  // States
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDealers = async () => {
    try {
      const res = await fetch(`${API_URL}/stock/dealers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDealers(data);
        if (data.length > 0) setDealer(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateBatch = async () => {
    setLoadingBatch(true);
    try {
      const res = await fetch(`${API_URL}/stock/generate-batch-number`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBatchNumber(data.batchNumber);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBatch(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login?staff=true');
      return;
    }
    fetchDealers();
    generateBatch();
  }, [token]);

  // Sync Serial / IMEI input boxes based on quantity
  useEffect(() => {
    const qty = parseInt(quantity) || 0;
    setSerialNos(Array(qty).fill(''));
    setImeis(Array(qty).fill(''));
  }, [quantity]);

  const handleSerialChange = (idx, val) => {
    const nextSerials = [...serialNos];
    nextSerials[idx] = val;
    setSerialNos(nextSerials);
  };

  const handleImeiChange = (idx, val) => {
    const nextImeis = [...imeis];
    nextImeis[idx] = val;
    setImeis(nextImeis);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!brand || !modelName || !color || !ram || !storage || !dealer || !purchaseDate || !costPrice || !sellingPrice || !quantity) {
      setError('Please fill in all required configurations.');
      return;
    }

    if (!/^[a-zA-Z0-9\s\/]+$/.test(modelName)) {
      setError('Model name cannot contain special characters, plus, minus or decimals.');
      return;
    }

    if (!/[a-zA-Z]/.test(modelName)) {
      setError('Model name must contain at least one letter.');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(color)) {
      setError('Color name must contain letters and spaces only.');
      return;
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

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
          screen_size: parseFloat(screenSize) || null,
          simtype: simType,
          batch_number: batchNumber,
          dealer,
          purchase_date: purchaseDate,
          cost_price: parseFloat(costPrice),
          selling_price: parseFloat(sellingPrice),
          quantity: qty,
          product_category: productCategory,
          serial_nos: serialNos,
          imeis: imeis
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        // Clear fields
        setModelName('');
        setColor('');
        setRam('');
        setStorage('');
        setScreenSize('');
        setCostPrice('');
        setSellingPrice('');
        setQuantity('1');
        generateBatch();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server communication failed.');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      <button onClick={() => navigate('/admin')} className="glass-btn glass-btn-secondary" style={{ borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '30px' }}>
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="glass-panel" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '10px' }}>Goods Receiving & Restock</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '30px' }}>
          Assign incoming stock configuration, log unique serials/IMEIs, and commit to inventory.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Product Category *</label>
              <select className="glass-input" value={productCategory} onChange={(e) => setProductCategory(e.target.value)}>
                <option value="Smartphone">Smartphone</option>
                <option value="Tablet">Tablet</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Brand Name *</label>
              <input type="text" placeholder="e.g. Apple, Samsung" className="glass-input" value={brand} onChange={(e) => setBrand(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Model Name *</label>
              <input type="text" placeholder="e.g. iPhone 15 Pro" className="glass-input" value={modelName} onChange={(e) => setModelName(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Color *</label>
              <input type="text" placeholder="e.g. Titanium Gray" className="glass-input" value={color} onChange={(e) => setColor(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>RAM *</label>
              <input type="text" placeholder="e.g. 8GB" className="glass-input" value={ram} onChange={(e) => setRam(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>ROM / Storage *</label>
              <input type="text" placeholder="e.g. 256GB" className="glass-input" value={storage} onChange={(e) => setStorage(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Screen Size</label>
              <input type="number" step="0.1" placeholder="e.g. 6.1" className="glass-input" value={screenSize} onChange={(e) => setScreenSize(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Sim Type</label>
              <select className="glass-input" value={simType} onChange={(e) => setSimType(e.target.value)}>
                <option value="Single SIM">Single SIM</option>
                <option value="Dual SIM">Dual SIM</option>
                <option value="eSIM">eSIM</option>
                <option value="None">None (Wi-Fi only)</option>
              </select>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Supplier / Dealer *</label>
              <input type="text" placeholder="e.g. Dialog Axiata" className="glass-input" value={dealer} onChange={(e) => setDealer(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Purchase Date *</label>
              <input type="date" className="glass-input" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Cost Price (Rs.) *</label>
              <input type="number" step="0.01" className="glass-input" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Selling Price (Rs.) *</label>
              <input type="number" step="0.01" className="glass-input" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Batch Quantity *</label>
              <input type="number" min="1" className="glass-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Unique Batch Number *</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" className="glass-input" style={{ flexGrow: 1 }} value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} required />
              <button type="button" onClick={generateBatch} disabled={loadingBatch} className="glass-btn glass-btn-secondary">
                <RefreshCw size={16} /> Regenerate
              </button>
            </div>
          </div>

          {/* Render individual serial / IMEI rows based on quantity */}
          {parseInt(quantity) > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Enter Serial Numbers & IMEIs:</h3>
              
              {Array.from({ length: parseInt(quantity) }).map((_, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder={`Unit #${idx + 1} Serial Number`}
                    className="glass-input"
                    value={serialNos[idx] || ''}
                    onChange={(e) => handleSerialChange(idx, e.target.value)}
                  />
                  {productCategory !== 'Tablet' || simType !== 'None' ? (
                    <input
                      type="text"
                      placeholder={`Unit #${idx + 1} IMEI`}
                      className="glass-input"
                      value={imeis[idx] || ''}
                      onChange={(e) => handleImeiChange(idx, e.target.value)}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {error && <div style={{ color: 'var(--danger)', fontSize: '13px', background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px' }}>{error}</div>}
          {success && <div style={{ color: 'var(--success)', fontSize: '13px', background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '8px' }}>{success}</div>}

          <button type="submit" className="glass-btn" style={{ width: '100%', borderRadius: '8px', padding: '15px' }}>
            Commit New Stock Batch
          </button>
        </form>
      </div>

    </div>
  );
}
