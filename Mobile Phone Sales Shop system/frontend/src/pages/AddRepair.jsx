import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Wrench, Search, Info, CheckCircle, ArrowLeft, 
  Tag, Barcode, User, DollarSign, Calendar, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ToastAlert from '../components/ToastAlert';
import ConfirmModal from '../components/ConfirmModal';
import './AddRepair.css';

export default function AddRepair() {
  const { token, API_URL, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [productSelect, setProductSelect] = useState('');
  const [productCustom, setProductCustom] = useState('');
  const [imeiNumber, setImeiNumber] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [issue, setIssue] = useState('');
  const [cost, setCost] = useState('');
  const [income, setIncome] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [status, setStatus] = useState('Pending');
  const [repairDate, setRepairDate] = useState(new Date().toISOString().slice(0, 10));

  // Dropdown data options
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [imeiList, setImeiList] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Quick search state
  const [quickQuery, setQuickQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Loading & Alerts
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const searchBoxRef = useRef(null);

  // 1. Initial Data Fetch: Brands & Technicians
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      navigate('/login?staff=true');
      return;
    }

    const fetchInitialData = async () => {
      try {
        // Fetch Brands
        const resBrands = await fetch(`${API_URL}/repairs/helper/brands`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resBrands.ok) {
          const dataBrands = await resBrands.json();
          setBrands(dataBrands);
        }

        // Fetch Technicians
        const resTechs = await fetch(`${API_URL}/staff/technicians`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resTechs.ok) {
          const dataTechs = await resTechs.json();
          setTechnicians(dataTechs);
        }
      } catch (err) {
        console.error('Error fetching initial options:', err);
      }
    };

    fetchInitialData();
  }, [token, authLoading]);

  // Click outside listener for quick search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper: Strip leading brand name if present
  const cleanBrandFromProduct = (brand, product) => {
    if (!product) return '';
    if (!brand || brand === 'Other') return product.trim();
    const regex = new RegExp('^' + brand.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i');
    return product.replace(regex, '').trim();
  };

  // Helper: Format combined device display name
  const formatCombinedDeviceName = (brand, product) => {
    const b = (brand || '').trim();
    const p = (product || '').trim();
    if (!p) return b;
    if (!b || b === 'Other') return p;
    const cleanP = cleanBrandFromProduct(b, p);
    return cleanP ? `${b} ${cleanP}` : b;
  };

  // Auto-update combined device display name whenever brand or product selection changes
  useEffect(() => {
    const activeProduct = productSelect === 'custom' ? productCustom : productSelect;
    const combined = formatCombinedDeviceName(brandName, activeProduct);
    if (combined) {
      setDeviceName(combined);
    }
  }, [brandName, productSelect, productCustom]);

  // 2. Fetch products when Brand changes
  const handleBrandChange = async (newBrand) => {
    setBrandName(newBrand);
    setProductSelect('');
    setProductCustom('');
    setImeiNumber('');
    setProducts([]);
    setImeiList([]);

    if (!newBrand || newBrand === 'Other') return;

    try {
      const res = await fetch(`${API_URL}/repairs/helper/products-by-brand?brand=${encodeURIComponent(newBrand)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products by brand:', err);
    }
  };

  // 3. Fetch IMEIs when Product changes
  const handleProductSelectChange = async (newProdVal) => {
    setProductSelect(newProdVal);
    setImeiNumber('');
    setImeiList([]);

    if (!newProdVal || newProdVal === 'custom') return;

    try {
      const res = await fetch(`${API_URL}/repairs/helper/imeis-by-product?productName=${encodeURIComponent(newProdVal)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setImeiList(data);
      }
    } catch (err) {
      console.error('Error fetching IMEIs:', err);
    }
  };

  // 4. Quick Live Search lookup
  useEffect(() => {
    if (quickQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_URL}/repairs/quick-search?q=${encodeURIComponent(quickQuery.trim())}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Quick search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [quickQuery]);

  // Click quick search result item -> Auto-fill
  const handleSelectSearchResult = async (item) => {
    setShowDropdown(false);
    setQuickQuery('');

    const targetBrand = item.brand || 'Other';
    setBrandName(targetBrand);

    if (item.brand && item.brand !== 'Other') {
      try {
        const res = await fetch(`${API_URL}/repairs/helper/products-by-brand?brand=${encodeURIComponent(item.brand)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const prodData = await res.json();
          setProducts(prodData);

          const matchedProd = prodData.find(p => p.product_name.toLowerCase() === (item.product_name || '').toLowerCase());
          if (matchedProd) {
            setProductSelect(matchedProd.product_name);
            setProductCustom('');
          } else {
            setProductSelect('custom');
            setProductCustom(cleanBrandFromProduct(item.brand, item.product_name));
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setProductSelect('custom');
      setProductCustom(item.product_name || '');
    }

    if (item.imei) {
      setImeiNumber(item.imei);
    }

    const combinedName = item.display_name || formatCombinedDeviceName(targetBrand, item.product_name);
    setDeviceName(combinedName);
  };

  // Form submission handler
  const executeFormSubmit = async () => {
    setShowConfirmModal(false);
    setError('');
    setSuccess('');
    setSubmitting(true);

    const activeProd = productSelect === 'custom' ? productCustom : productSelect;

    try {
      const res = await fetch(`${API_URL}/repairs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          CustomerName: customerName.trim(),
          BrandName: brandName,
          ProductName: activeProd.trim(),
          IMEINumber: imeiNumber.trim(),
          DeviceName: deviceName.trim(),
          Issue: issue.trim(),
          Cost: parseFloat(cost || 0),
          Income: parseFloat(income || 0),
          TechnicianId: parseInt(technicianId),
          Status: status,
          RepairDate: repairDate
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Repair log has been successfully added.');
        setTimeout(() => {
          navigate('/admin/manage-repairs.php');
        }, 1200);
      } else {
        setError(data.message || 'Failed to add repair log.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error while logging repair job.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAttempt = (e) => {
    e.preventDefault();
    setError('');
    const errors = {};

    if (!customerName.trim() || !/^[a-zA-Z\s]+$/.test(customerName.trim())) {
      errors.customerName = 'Customer Name can only contain letters and spaces.';
    }
    if (!deviceName.trim()) {
      errors.deviceName = 'Device Name & Model is required.';
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
    if (!technicianId) {
      errors.technicianId = 'Assigned Technician is required.';
    }
    if (!repairDate) {
      errors.repairDate = 'Repair Date is required.';
    } else {
      const today = new Date().toISOString().slice(0, 10);
      if (repairDate > today) {
        errors.repairDate = 'Repair Date cannot be in the future.';
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
            <li className="breadcrumb-item"><Link to="/admin/dashboard.php" className="text-decoration-none text-info">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/admin/manage-repairs.php" className="text-decoration-none text-info">Manage Repairs</Link></li>
            <li className="breadcrumb-item active text-light" aria-current="page">Log Repair</li>
          </ol>
        </nav>

        {error && <ToastAlert type="error" message={error} onClose={() => setError('')} />}
        {success && <ToastAlert type="success" message={success} onClose={() => setSuccess('')} />}

        <ConfirmModal
          isOpen={showConfirmModal}
          title="Confirm Log Repair"
          message="Please confirm that you wish to log this repair job."
          onConfirm={executeFormSubmit}
          onCancel={() => setShowConfirmModal(false)}
        />

        <div className="card card-repair border-0">
          <div className="card-repair-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-white d-flex align-items-center gap-2">
              <Wrench /> Log New Device Repair
            </h5>
            <button 
              className="btn btn-outline-light btn-sm rounded-pill d-flex align-items-center gap-1"
              onClick={() => navigate('/admin/manage-repairs.php')}
            >
              <ArrowLeft size={16} /> Back to Repairs
            </button>
          </div>

          <div className="card-body p-4">
            
            {/* Quick IMEI / Device Search Bar */}
            <div className="quick-search-box p-3 mb-4" ref={searchBoxRef}>
              <label htmlFor="quick_repair_search" className="form-label fw-bold text-white mb-1 d-flex align-items-center gap-2">
                <Search className="text-primary" size={18} /> Quick Search Device or Store IMEI (Auto-Fill)
              </label>
              <div className="position-relative">
                <input 
                  type="text" 
                  id="quick_repair_search" 
                  className="form-control form-control-lg custom-input" 
                  placeholder="Type IMEI number, brand, or model name to auto-fill device details..." 
                  value={quickQuery}
                  onChange={e => setQuickQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                  autoComplete="off"
                />
                {isSearching && <div className="p-2 text-muted small">Searching catalog...</div>}
                
                {showDropdown && (
                  <div className="search-results-dropdown-dark shadow-lg">
                    {searchResults.length === 0 ? (
                      <div className="p-3 text-muted small">No matching device or IMEI found.</div>
                    ) : (
                      searchResults.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="search-result-item-dark"
                          onClick={() => handleSelectSearchResult(item)}
                        >
                          {item.imei && <span className="badge bg-primary me-2">IMEI: {item.imei}</span>}
                          <strong className="text-white">{item.display_name || formatCombinedDeviceName(item.brand, item.product_name)}</strong>
                          <span className="text-muted small ms-2">({item.color || ''} {item.storage || ''})</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <span className="small text-muted mt-2 d-flex align-items-center gap-1">
                <Info size={14} /> You can also select the Brand, Product, and IMEI manually from the dropdowns below.
              </span>
            </div>

            {/* Main Repair Form */}
            <form onSubmit={handleSubmitAttempt}>
              <div className="row g-3">

                {/* Customer Name */}
                <div className="col-md-6">
                  <label htmlFor="customer_name" className="form-label fw-semibold text-light">
                    Customer Full Name <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={`form-control custom-input ${fieldErrors.customerName ? 'is-invalid border-danger' : ''}`}
                    id="customer_name" 
                    value={customerName}
                    onChange={e => { setCustomerName(e.target.value); setFieldErrors(prev => ({ ...prev, customerName: '' })); }}
                    required 
                    pattern="[a-zA-Z\s]+" 
                    title="Only letters and spaces are allowed." 
                    placeholder="e.g. Ruwan Perera"
                  />
                  {fieldErrors.customerName && <div className="text-danger extra-small mt-1">{fieldErrors.customerName}</div>}
                </div>

                {/* Brand Name Selection */}
                <div className="col-md-6">
                  <label htmlFor="brand_name" className="form-label fw-semibold text-light">
                    Brand Name <span className="text-danger">*</span>
                  </label>
                  <select 
                    className="form-select custom-input" 
                    id="brand_name" 
                    value={brandName}
                    onChange={e => handleBrandChange(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Brand...</option>
                    {brands.map((b, i) => (
                      <option key={i} value={b.BrandName}>{b.BrandName}</option>
                    ))}
                    <option value="Other">Other / Customer Brand</option>
                  </select>
                </div>

                {/* Product Name Selection */}
                <div className="col-md-6">
                  <label htmlFor="product_name_select" className="form-label fw-semibold text-light">
                    Product / Model Name <span className="text-danger">*</span>
                  </label>
                  {(!brandName || brandName === 'Other') ? (
                    <input 
                      type="text" 
                      className="form-control custom-input" 
                      placeholder="Type product model manually..."
                      value={productCustom}
                      onChange={e => setProductCustom(e.target.value)}
                      required
                    />
                  ) : (
                    <>
                      <select 
                        className="form-select custom-input" 
                        id="product_name_select"
                        value={productSelect}
                        onChange={e => handleProductSelectChange(e.target.value)}
                      >
                        <option value="" disabled>Select Product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.product_name}>{p.product_name}</option>
                        ))}
                        <option value="custom">+ Type Custom Product Model</option>
                      </select>
                      {productSelect === 'custom' && (
                        <input 
                          type="text" 
                          className="form-control custom-input mt-2" 
                          placeholder="Type product model manually..."
                          value={productCustom}
                          onChange={e => setProductCustom(e.target.value)}
                          required
                        />
                      )}
                    </>
                  )}
                </div>

                {/* IMEI Number Selection */}
                <div className="col-md-6">
                  <label htmlFor="imei_number" className="form-label fw-semibold text-light">
                    IMEI Number (Optional / Searchable)
                  </label>
                  {imeiList.length > 0 ? (
                    <select 
                      className="form-select custom-input" 
                      id="imei_number"
                      value={imeiNumber}
                      onChange={e => setImeiNumber(e.target.value)}
                    >
                      <option value="">-- Optional / Select IMEI --</option>
                      {imeiList.map((item, idx) => (
                        <option key={idx} value={item.imei}>
                          {item.imei} &mdash; {item.specs} [{item.status}]
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      className="form-control custom-input"
                      placeholder="Type or select IMEI number..."
                      value={imeiNumber}
                      onChange={e => setImeiNumber(e.target.value)}
                    />
                  )}
                </div>

                {/* Device Display Name */}
                <div className="col-12">
                  <label htmlFor="device_name" className="form-label fw-semibold text-light">
                    Device Display Name <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={`form-control custom-input ${fieldErrors.deviceName ? 'is-invalid border-danger' : ''}`}
                    id="device_name" 
                    value={deviceName}
                    onChange={e => { setDeviceName(e.target.value); setFieldErrors(prev => ({ ...prev, deviceName: '' })); }}
                    required 
                    placeholder="e.g. Apple iPhone 15 Pro"
                  />
                  {fieldErrors.deviceName && <div className="text-danger extra-small mt-1">{fieldErrors.deviceName}</div>}
                </div>

                {/* Issue Details */}
                <div className="col-12">
                  <label htmlFor="issue" className="form-label fw-semibold text-light">
                    Issue Details <span className="text-danger">*</span>
                  </label>
                  <textarea 
                    className={`form-control custom-input ${fieldErrors.issue ? 'is-invalid border-danger' : ''}`}
                    id="issue" 
                    rows={3} 
                    value={issue}
                    onChange={e => { setIssue(e.target.value); setFieldErrors(prev => ({ ...prev, issue: '' })); }}
                    required 
                    placeholder="Describe the fault and work required..."
                  />
                  {fieldErrors.issue && <div className="text-danger extra-small mt-1">{fieldErrors.issue}</div>}
                </div>

                {/* Cost & Income */}
                <div className="col-md-6">
                  <label htmlFor="cost" className="form-label fw-semibold text-light">
                    Estimated / Actual Cost (Rs.) <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="number" 
                    className={`form-control custom-input ${fieldErrors.cost ? 'is-invalid border-danger' : ''}`}
                    id="cost" 
                    step="0.01" 
                    min="0" 
                    value={cost}
                    onChange={e => { setCost(e.target.value); setFieldErrors(prev => ({ ...prev, cost: '' })); }}
                    required 
                    placeholder="e.g. 5000.00"
                  />
                  {fieldErrors.cost && <div className="text-danger extra-small mt-1">{fieldErrors.cost}</div>}
                </div>
                <div className="col-md-6">
                  <label htmlFor="income" className="form-label fw-semibold text-light">
                    Income Charged to Customer (Rs.) <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="number" 
                    className={`form-control custom-input ${fieldErrors.income ? 'is-invalid border-danger' : ''}`}
                    id="income" 
                    step="0.01" 
                    min="0" 
                    value={income}
                    onChange={e => { setIncome(e.target.value); setFieldErrors(prev => ({ ...prev, income: '' })); }}
                    required 
                    placeholder="e.g. 9500.00"
                  />
                  {fieldErrors.income && <div className="text-danger extra-small mt-1">{fieldErrors.income}</div>}
                </div>

                {/* Technician, Status, Date */}
                <div className="col-md-4">
                  <label htmlFor="technician_id" className="form-label fw-semibold text-light">
                    Assigned Technician / Staff <span className="text-danger">*</span>
                  </label>
                  <select 
                    className={`form-select custom-input ${fieldErrors.technicianId ? 'is-invalid border-danger' : ''}`}
                    id="technician_id" 
                    value={technicianId}
                    onChange={e => { setTechnicianId(e.target.value); setFieldErrors(prev => ({ ...prev, technicianId: '' })); }}
                    required
                  >
                    <option value="" disabled>Select technician...</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.role})</option>
                    ))}
                  </select>
                  {fieldErrors.technicianId && <div className="text-danger extra-small mt-1">{fieldErrors.technicianId}</div>}
                </div>

                <div className="col-md-4">
                  <label htmlFor="status" className="form-label fw-semibold text-light">
                    Job Status <span className="text-danger">*</span>
                  </label>
                  <select 
                    className="form-select custom-input" 
                    id="status" 
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="In-progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label htmlFor="repair_date" className="form-label fw-semibold text-light">
                    Repair / Log Date <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="date" 
                    className={`form-control custom-input ${fieldErrors.repairDate ? 'is-invalid border-danger' : ''}`}
                    id="repair_date" 
                    value={repairDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={e => { setRepairDate(e.target.value); setFieldErrors(prev => ({ ...prev, repairDate: '' })); }}
                    required 
                  />
                  {fieldErrors.repairDate && <div className="text-danger extra-small mt-1">{fieldErrors.repairDate}</div>}
                </div>

              </div>

              <div className="mt-4 text-end d-flex justify-content-end gap-2">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary px-4 rounded-pill"
                  onClick={() => navigate('/admin/manage-repairs.php')}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary px-4 rounded-pill d-flex align-items-center gap-2"
                  disabled={submitting}
                >
                  <CheckCircle size={18} /> {submitting ? 'Saving...' : 'Log Repair'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
