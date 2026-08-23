import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Smartphone, FolderPlus, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminProducts() {
  const { token, API_URL } = useAuth();
  const navigate = useNavigate();

  // Active Tab: 'products', 'categories', 'brands'
  const [activeTab, setActiveTab] = useState('products');

  // Lists
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Product form states ---
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [productName, setProductName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [display, setDisplay] = useState('');
  const [simType, setSimType] = useState('Single SIM');
  const [status, setStatus] = useState('1');
  const [categoryId, setCategoryId] = useState('');

  // --- Category form states ---
  const [categoryAddName, setCategoryAddName] = useState('');
  const [categoryAddStatus, setCategoryAddStatus] = useState('1');
  const [editingCategory, setEditingCategory] = useState(null); // { ID, CategoryName, Status }

  // --- Brand form states ---
  const [brandAddName, setBrandAddName] = useState('');
  const [brandAddStatus, setBrandAddStatus] = useState('1');
  const [editingBrand, setEditingBrand] = useState(null); // { ID, BrandName, Status }

  // Error/Success
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : (data.products || []));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/products/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !categoryId) setCategoryId(data[0].ID.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_URL}/products/brands`);
      if (res.ok) {
        const data = await res.json();
        setBrands(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login?staff=true');
      return;
    }
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, [token]);

  // --- Product CRUD ---
  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setIsAddMode(false);
    setProductName(p.ProductName);
    setBrandName(p.BrandName);
    setModelNumber(p.ModelNumber);
    setDisplay(p.Display || '');
    setSimType(p.SimType || 'Single SIM');
    setStatus(p.Status.toString());
    
    // Look up categoryId by matching categoryName
    const match = categories.find(c => c.CategoryName === p.CategoryName);
    setCategoryId(match ? match.ID.toString() : (categories.length > 0 ? categories[0].ID.toString() : ''));
    
    setError('');
    setSuccess('');
  };

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setIsAddMode(true);
    setProductName('');
    setBrandName('');
    setModelNumber('');
    setDisplay('');
    setSimType('Single SIM');
    setStatus('1');
    setCategoryId(categories.length > 0 ? categories[0].ID.toString() : '');
    setError('');
    setSuccess('');
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!productName || !brandName || !modelNumber || !categoryId) {
      setError('Product title, brand name, model number, and category are required.');
      return;
    }

    if (!/^[a-zA-Z0-9\s\/]+$/.test(modelNumber)) {
      setError('Model number cannot contain special characters, plus, minus or decimals.');
      return;
    }

    const selectedCat = categories.find(c => c.ID.toString() === categoryId.toString());
    const categoryName = selectedCat ? selectedCat.CategoryName : '';

    const payload = {
      ProductName: productName,
      BrandName: brandName,
      CategoryName: categoryName,
      ModelNumber: modelNumber,
      SimType: simType,
      Display: display,
      Status: parseInt(status)
    };

    try {
      let res;
      if (isAddMode) {
        res = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/products/${selectedProduct.ID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setSelectedProduct(null);
        setIsAddMode(false);
        fetchProducts();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server request failed.');
    }
  };

  const handleProductDelete = async (productId) => {
    if (!window.confirm('WARNING: Deleting this product will remove all of its specifications and configurations. Proceed?')) return;
    try {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Product catalog item deleted.');
        setSelectedProduct(null);
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Category CRUD ---
  const handleCategoryAdd = async (e) => {
    e.preventDefault();
    if (!categoryAddName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/products/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categoryName: categoryAddName, status: parseInt(categoryAddStatus) })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setCategoryAddName('');
        fetchCategories();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryUpdate = async (e) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.CategoryName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/products/categories/${editingCategory.ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categoryName: editingCategory.CategoryName, status: parseInt(editingCategory.Status) })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setEditingCategory(null);
        fetchCategories();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/products/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Brand CRUD ---
  const handleBrandAdd = async (e) => {
    e.preventDefault();
    if (!brandAddName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/products/brands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ brandName: brandAddName, status: parseInt(brandAddStatus) })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setBrandAddName('');
        fetchBrands();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBrandUpdate = async (e) => {
    e.preventDefault();
    if (!editingBrand || !editingBrand.BrandName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/products/brands/${editingBrand.ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ brandName: editingBrand.BrandName, status: parseInt(editingBrand.Status) })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setEditingBrand(null);
        fetchBrands();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBrandDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/products/brands/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) {
        fetchBrands();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <button onClick={() => navigate('/admin')} className="glass-btn glass-btn-secondary" style={{ borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Product & Taxonomy Catalog</h1>
        </div>

        {activeTab === 'products' && (
          <button onClick={handleOpenAdd} className="glass-btn" style={{ borderRadius: '8px' }}>
            <Plus size={16} /> Create Catalog Item
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
        <button
          onClick={() => { setActiveTab('products'); setSelectedProduct(null); setIsAddMode(false); }}
          className={`glass-btn ${activeTab === 'products' ? '' : 'glass-btn-secondary'}`}
          style={{ borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Smartphone size={16} /> Products Catalog
        </button>
        <button
          onClick={() => { setActiveTab('categories'); setEditingCategory(null); }}
          className={`glass-btn ${activeTab === 'categories' ? '' : 'glass-btn-secondary'}`}
          style={{ borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FolderPlus size={16} /> Categories
        </button>
        <button
          onClick={() => { setActiveTab('brands'); setEditingBrand(null); }}
          className={`glass-btn ${activeTab === 'brands' ? '' : 'glass-btn-secondary'}`}
          style={{ borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Tag size={16} /> Brands
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: (selectedProduct || isAddMode) ? '1fr 1fr' : '1fr',
          gap: '30px',
          alignItems: 'flex-start'
        }}>
          {/* Products List Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            {loading ? (
              <div style={{ color: 'var(--text-muted)' }}>Fetching catalog...</div>
            ) : products.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No catalog items found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {products.map(p => (
                  <div key={p.ID} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ fontSize: '24px' }}>📱</div>
                      <div>
                        <strong style={{ fontSize: '15px' }}>{p.ProductName}</strong>
                        <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)' }}>
                          Brand: {p.BrandName} &bull; Model: {p.ModelNumber} &bull; Category: {p.CategoryName}
                        </span>
                        <span style={{ fontSize: '11px', display: 'block', color: p.Status === 1 ? 'var(--success)' : 'var(--danger)' }}>
                          Status: {p.Status === 1 ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <button onClick={() => handleOpenEdit(p)} className="glass-btn glass-btn-secondary" style={{ padding: '8px 12px', borderRadius: '8px' }}>
                      <Edit2 size={14} /> Edit Specifications
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Product Form Panel */}
          {(selectedProduct || isAddMode) && (
            <div className="glass-panel animate-fade-in" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800' }}>
                  {isAddMode ? 'Create New Catalog Item' : `Edit Product Specs`}
                </h2>
                <button onClick={() => { setSelectedProduct(null); setIsAddMode(false); }} className="glass-btn glass-btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Close</button>
              </div>

              <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Product Title *</label>
                  <input type="text" placeholder="e.g. Galaxy S24 Ultra" className="glass-input" value={productName} onChange={(e) => setProductName(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600' }}>Brand Name *</label>
                    <select className="glass-input" value={brandName} onChange={(e) => setBrandName(e.target.value)} required>
                      <option value="">Select Brand</option>
                      {brands.map(b => (
                        <option key={b.ID} value={b.BrandName}>{b.BrandName} {b.Status === 0 ? '(Inactive)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600' }}>Model Number *</label>
                    <input type="text" placeholder="e.g. SM-S928B" className="glass-input" value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600' }}>Display Info</label>
                    <input type="text" placeholder="e.g. 6.8 inch AMOLED" className="glass-input" value={display} onChange={(e) => setDisplay(e.target.value)} />
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600' }}>Catalog Category *</label>
                    <select className="glass-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                      {categories.map(c => (
                        <option key={c.ID} value={c.ID}>{c.CategoryName} {c.Status === 0 ? '(Inactive)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600' }}>Catalog Status</label>
                    <select className="glass-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="1">Active / Listed</option>
                      <option value="0">Disabled / Unlisted</option>
                    </select>
                  </div>
                </div>

                {error && <div style={{ color: 'var(--danger)', fontSize: '13px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '6px' }}>{error}</div>}
                {success && <div style={{ color: 'var(--success)', fontSize: '13px', background: 'rgba(16,185,129,0.1)', padding: '10px', borderRadius: '6px' }}>{success}</div>}

                <button type="submit" className="glass-btn" style={{ borderRadius: '8px', marginTop: '10px' }}>
                  Save Specifications
                </button>

                {!isAddMode && (
                  <button type="button" onClick={() => handleProductDelete(selectedProduct.ID)} className="glass-btn glass-btn-danger" style={{ borderRadius: '8px', marginTop: '5px' }}>
                    <Trash2 size={16} /> Permanently Delete Catalog Record
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', alignItems: 'flex-start' }}>
          {/* Add / Edit Category Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            {editingCategory ? (
              <form onSubmit={handleCategoryUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Edit Category</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Category Name</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={editingCategory.CategoryName}
                    onChange={(e) => setEditingCategory({ ...editingCategory, CategoryName: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Status</label>
                  <select
                    className="glass-input"
                    value={editingCategory.Status}
                    onChange={(e) => setEditingCategory({ ...editingCategory, Status: e.target.value })}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="glass-btn" style={{ flexGrow: 1, borderRadius: '8px' }}>Update</button>
                  <button type="button" onClick={() => setEditingCategory(null)} className="glass-btn glass-btn-secondary" style={{ borderRadius: '8px' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCategoryAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Add New Category</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Smart Watch"
                    className="glass-input"
                    value={categoryAddName}
                    onChange={(e) => setCategoryAddName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Status</label>
                  <select
                    className="glass-input"
                    value={categoryAddStatus}
                    onChange={(e) => setCategoryAddStatus(e.target.value)}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>

                <button type="submit" className="glass-btn" style={{ borderRadius: '8px', marginTop: '10px' }}>Add Category</button>
              </form>
            )}
          </div>

          {/* Categories List */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Categories List</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categories.map(c => (
                <div key={c.ID} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '15px' }}>{c.CategoryName}</strong>
                    <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Created: {new Date(c.CreationDate).toLocaleDateString()}
                    </span>
                    <span style={{
                      background: c.Status === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: c.Status === 1 ? 'var(--success)' : 'var(--danger)',
                      padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', display: 'inline-block', marginTop: '6px'
                    }}>
                      {c.Status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setEditingCategory(c)} className="glass-btn glass-btn-secondary" style={{ padding: '6px 10px', borderRadius: '6px' }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleCategoryDelete(c.ID)} className="glass-btn glass-btn-danger" style={{ padding: '6px 10px', borderRadius: '6px' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BRANDS TAB */}
      {activeTab === 'brands' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', alignItems: 'flex-start' }}>
          {/* Add / Edit Brand Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            {editingBrand ? (
              <form onSubmit={handleBrandUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Edit Brand</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Brand Name</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={editingBrand.BrandName}
                    onChange={(e) => setEditingBrand({ ...editingBrand, BrandName: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Status</label>
                  <select
                    className="glass-input"
                    value={editingBrand.Status}
                    onChange={(e) => setEditingBrand({ ...editingBrand, Status: e.target.value })}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="glass-btn" style={{ flexGrow: 1, borderRadius: '8px' }}>Update</button>
                  <button type="button" onClick={() => setEditingBrand(null)} className="glass-btn glass-btn-secondary" style={{ borderRadius: '8px' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleBrandAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Add New Brand</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apple"
                    className="glass-input"
                    value={brandAddName}
                    onChange={(e) => setBrandAddName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Status</label>
                  <select
                    className="glass-input"
                    value={brandAddStatus}
                    onChange={(e) => setBrandAddStatus(e.target.value)}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>

                <button type="submit" className="glass-btn" style={{ borderRadius: '8px', marginTop: '10px' }}>Add Brand</button>
              </form>
            )}
          </div>

          {/* Brands List */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Brands List</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {brands.map(b => (
                <div key={b.ID} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '15px' }}>{b.BrandName}</strong>
                    <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Created: {new Date(b.CreationDate).toLocaleDateString()}
                    </span>
                    <span style={{
                      background: b.Status === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: b.Status === 1 ? 'var(--success)' : 'var(--danger)',
                      padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', display: 'inline-block', marginTop: '6px'
                    }}>
                      {b.Status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setEditingBrand(b)} className="glass-btn glass-btn-secondary" style={{ padding: '6px 10px', borderRadius: '6px' }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleBrandDelete(b.ID)} className="glass-btn glass-btn-danger" style={{ padding: '6px 10px', borderRadius: '6px' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
