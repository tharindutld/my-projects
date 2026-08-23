import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, RefreshCw, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';
import ToastAlert from '../components/ToastAlert';

export default function AdminPricing() {
  const { token, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();

  // Lists
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for Individual discount form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [percent, setPercent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // States for Bulk discount form
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [bulkPercent, setBulkPercent] = useState('');
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');

  // Status indicators & Confirm modal
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch(`${API_URL}/products?limit=200`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const pList = Array.isArray(prodData) ? prodData : (prodData.products || []);
        setProducts(pList);
        if (pList.length > 0) setSelectedProductId(pList[0].ID.toString());
      }

      const catRes = await fetch(`${API_URL}/products/categories`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
        if (catData.length > 0) setSelectedCategoryId(catData[0].ID.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate('/login?staff=true');
      return;
    }
    loadData();
  }, [token, authLoading]);

  const handleApplyIndividual = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const discountVal = parseFloat(percent);
    if (isNaN(discountVal) || discountVal < 0 || discountVal > 99) {
      setError('Discount percent must be a positive number less than 100.');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (startDate && startDate < todayStr) {
      setError('Start Date cannot be in the past.');
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setError('End Date cannot occur before the Start Date.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/pricing/individual`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: parseInt(selectedProductId),
          percent: discountVal,
          startDate: startDate || null,
          endDate: endDate || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setPercent('');
        setStartDate('');
        setEndDate('');
        loadData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Pricing request failed.');
    }
  };

  const handleApplyBulk = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const discountVal = parseFloat(bulkPercent);
    if (isNaN(discountVal) || discountVal < 0 || discountVal > 99) {
      setError('Bulk discount percent must be a positive number less than 100.');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (bulkStartDate && bulkStartDate < todayStr) {
      setError('Bulk Start Date cannot be in the past.');
      return;
    }

    if (bulkStartDate && bulkEndDate && bulkEndDate < bulkStartDate) {
      setError('Bulk End Date cannot occur before the Start Date.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/pricing/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryId: parseInt(selectedCategoryId),
          percent: discountVal,
          startDate: bulkStartDate || null,
          endDate: bulkEndDate || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setBulkPercent('');
        setBulkStartDate('');
        setBulkEndDate('');
        loadData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Bulk pricing request failed.');
    }
  };

  const handleClearPromotions = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Promotions',
      message: 'Are you sure you want to permanently clear all promotional discount schedules across the catalog?',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setError('');
        setSuccess('');
        try {
          const res = await fetch(`${API_URL}/pricing/clear`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setSuccess(data.message);
            loadData();
          } else {
            setError(data.message);
          }
        } catch (err) {
          setError('Failed to clear promotions.');
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
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Manage Promotional Pricing</h1>
        </div>

        <button onClick={handleClearPromotions} className="glass-btn glass-btn-danger" style={{ borderRadius: '8px' }}>
          Clear All Current Promotions
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px'
      }}>
        {/* Form 1: Individual Product Promo */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame className="text-accent" size={22} /> Individual Product Discount
          </h2>

          <form onSubmit={handleApplyIndividual} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Select Catalog Item *</label>
              <select className="glass-input" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} required>
                {products.map(p => (
                  <option key={p.ID} value={p.ID}>
                    {p.ProductName} ({p.BrandName}) - Current: {p.discountActive ? `${p.DiscountPercent}% OFF` : 'No Promo'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Discount Percentage (% OFF) *</label>
              <input type="number" placeholder="e.g. 15" className="glass-input" value={percent} onChange={(e) => setPercent(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Start Date</label>
                <input type="date" className="glass-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>End Date</label>
                <input type="date" className="glass-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="glass-btn" style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }}>
              Apply Promo Schedule
            </button>
          </form>
        </div>

        {/* Form 2: Bulk Category Promo */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers className="text-secondary" size={22} /> Bulk Category Discount
          </h2>

          <form onSubmit={handleApplyBulk} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Select Category *</label>
              <select className="glass-input" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} required>
                {categories.map(c => (
                  <option key={c.ID} value={c.ID}>{c.CategoryName}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Discount Percentage (% OFF) *</label>
              <input type="number" placeholder="e.g. 10" className="glass-input" value={bulkPercent} onChange={(e) => setBulkPercent(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Start Date</label>
                <input type="date" className="glass-input" value={bulkStartDate} onChange={(e) => setBulkStartDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>End Date</label>
                <input type="date" className="glass-input" value={bulkEndDate} onChange={(e) => setBulkEndDate(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="glass-btn" style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }}>
              Apply Bulk Promo
            </button>
          </form>
        </div>
      </div>

    </div>
    </AdminLayout>
  );
}
