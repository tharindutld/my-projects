import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Smartphone, FolderPlus, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';
import ToastAlert from '../components/ToastAlert';

export default function AdminProducts() {
  const { token, API_URL } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
  const [editingCategory, setEditingCategory] = useState(null);

  // --- Brand form states ---
  const [brandAddName, setBrandAddName] = useState('');
  const [brandAddStatus, setBrandAddStatus] = useState('1');
  const [editingBrand, setEditingBrand] = useState(null);

  // Error/Success Notification
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

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

  // Sync state from query parameters
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['products', 'brands', 'categories'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('products');
    }

    const actionParam = searchParams.get('action');
    if (actionParam === 'add' && (!tabParam || tabParam === 'products')) {
      handleOpenAdd();
    }
  }, [searchParams]);

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

  const handleProductDelete = (productId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: 'WARNING: Deleting this product will remove all of its specifications and configurations. Proceed?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setSuccess('Product catalog item deleted successfully.');
            setSelectedProduct(null);
            fetchProducts();
          } else {
            setError(data.message);
          }
        } catch (err) {
          setError('Failed to delete product.');
        }
      }
    });
  };

  // --- Category CRUD ---
  const handleCategoryAdd = async (e) => {
    e.preventDefault();
    if (!categoryAddName.trim()) {
      setError('Category name is required.');
      return;
    }
    setError('');
    setSuccess('');
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
        setSuccess(data.message);
        setCategoryAddName('');
        fetchCategories();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server request failed while adding category.');
    }
  };

  const handleCategoryUpdate = async (e) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.CategoryName.trim()) return;
    setError('');
    setSuccess('');
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
        setSuccess(data.message);
        setEditingCategory(null);
        fetchCategories();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server error updating category.');
    }
  };

  const handleCategoryDelete = (id, catName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete category '${catName}'?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/products/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setSuccess(data.message);
            fetchCategories();
          } else {
            setError(data.message);
          }
        } catch (err) {
          setError('Failed to delete category.');
        }
      }
    });
  };

  // --- Brand CRUD ---
  const handleBrandAdd = async (e) => {
    e.preventDefault();
    if (!brandAddName.trim()) {
      setError('Brand name is required.');
      return;
    }
    setError('');
    setSuccess('');
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
        setSuccess(data.message);
        setBrandAddName('');
        fetchBrands();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server request failed while adding brand.');
    }
  };

  const handleBrandUpdate = async (e) => {
    e.preventDefault();
    if (!editingBrand || !editingBrand.BrandName.trim()) return;
    setError('');
    setSuccess('');
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
        setSuccess(data.message);
        setEditingBrand(null);
        fetchBrands();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server error updating brand.');
    }
  };

  const handleBrandDelete = (id, bName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Brand',
      message: `Are you sure you want to delete brand '${bName}'?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/products/brands/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setSuccess(data.message);
            fetchBrands();
          } else {
            setError(data.message);
          }
        } catch (err) {
          setError('Failed to delete brand.');
        }
      }
    });
  };

  return (
    <AdminLayout>
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Toast Alert Notifications */}
      {error && <ToastAlert type="error" message={error} onClose={() => setError('')} />}
      {success && <ToastAlert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Catalog Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Manage devices, categories, and brand classifications.
          </p>
        </div>

        {activeTab === 'products' && (
          <button
            onClick={handleOpenAdd}
            className="glass-btn"
            style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Add New Product
          </button>
        )}
      </div>

      {/* Nav Tabs */}
      <div className="glass-panel" style={{ padding: '8px', display: 'flex', gap: '8px', marginBottom: '24px', borderRadius: '14px' }}>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: activeTab === 'products' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'products' ? '#fff' : 'var(--text-muted)',
            transition: 'var(--transition)'
          }}
        >
          <Smartphone size={18} /> Products ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: activeTab === 'categories' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'categories' ? '#fff' : 'var(--text-muted)',
            transition: 'var(--transition)'
          }}
        >
          <FolderPlus size={18} /> Categories ({categories.length})
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: activeTab === 'brands' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'brands' ? '#fff' : 'var(--text-muted)',
            transition: 'var(--transition)'
          }}
        >
          <Tag size={18} /> Brands ({brands.length})
        </button>
      </div>

      {/* ─── TAB 1: PRODUCTS ─── */}
      {activeTab === 'products' && (
        <>
          {/* Add / Edit Form Modal */}
          {(selectedProduct || isAddMode) && (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '30px', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                  {isAddMode ? 'Add New Product Item' : `Edit Product: ${selectedProduct?.ProductName}`}
                </h3>
                <button
                  onClick={() => { setSelectedProduct(null); setIsAddMode(false); }}
                  className="glass-btn glass-btn-secondary"
                  style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }}
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleProductSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="glass-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    className="glass-input"
                    placeholder="e.g. Galaxy S24 Ultra"
                  />
                </div>

                <div>
                  <label className="glass-label">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    className="glass-input"
                    placeholder="e.g. Samsung"
                  />
                </div>

                <div>
                  <label className="glass-label">Category *</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="glass-input"
                  >
                    {categories.map(c => (
                      <option key={c.ID} value={c.ID}>{c.CategoryName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="glass-label">Model Number *</label>
                  <input
                    type="text"
                    required
                    value={modelNumber}
                    onChange={e => setModelNumber(e.target.value)}
                    className="glass-input"
                    placeholder="e.g. SM-S928B"
                  />
                </div>

                <div>
                  <label className="glass-label">SIM Configuration</label>
                  <select
                    value={simType}
                    onChange={e => setSimType(e.target.value)}
                    className="glass-input"
                  >
                    <option value="Single SIM">Single SIM</option>
                    <option value="Dual SIM">Dual SIM</option>
                    <option value="eSIM Support">eSIM Support</option>
                  </select>
                </div>

                <div>
                  <label className="glass-label">Display Specs</label>
                  <input
                    type="text"
                    value={display}
                    onChange={e => setDisplay(e.target.value)}
                    className="glass-input"
                    placeholder="e.g. 6.8 inch Dynamic AMOLED"
                  />
                </div>

                <div>
                  <label className="glass-label">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="glass-input"
                  >
                    <option value="1">Active (Published)</option>
                    <option value="0">Inactive (Draft)</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="submit" className="glass-btn" style={{ borderRadius: '10px' }}>
                    {isAddMode ? 'Create Product' : 'Update Product Specs'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products List Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Product Catalog ({products.length})</h3>

            {loading ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading products...</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Product</th>
                      <th style={{ padding: '12px' }}>Brand / Category</th>
                      <th style={{ padding: '12px' }}>Model</th>
                      <th style={{ padding: '12px' }}>Starting Price</th>
                      <th style={{ padding: '12px' }}>Total Stock</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.ID} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontWeight: '700' }}>{p.ProductName}</td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                          {p.BrandName} &bull; {p.CategoryName}
                        </td>
                        <td style={{ padding: '12px' }}>{p.ModelNumber}</td>
                        <td style={{ padding: '12px', color: 'var(--primary)', fontWeight: '700' }}>
                          Rs. {parseFloat(p.MinPrice || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: p.TotalStock <= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                            color: p.TotalStock <= 5 ? 'var(--danger)' : 'var(--success)',
                            padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700'
                          }}>
                            {p.TotalStock || 0} units
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: p.Status === 1 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: p.Status === 1 ? 'var(--success)' : 'var(--danger)',
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700'
                          }}>
                            {p.Status === 1 ? 'Active' : 'Draft'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="glass-btn glass-btn-secondary"
                              style={{ padding: '6px 10px', borderRadius: '6px' }}
                              title="Edit product"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleProductDelete(p.ID)}
                              className="glass-btn glass-btn-danger"
                              style={{ padding: '6px 10px', borderRadius: '6px' }}
                              title="Delete product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── TAB 2: CATEGORIES ─── */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Add / Edit Category Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>

            {editingCategory ? (
              <form onSubmit={handleCategoryUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="glass-label">Category Name</label>
                  <input
                    type="text"
                    required
                    value={editingCategory.CategoryName}
                    onChange={e => setEditingCategory({ ...editingCategory, CategoryName: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="glass-label">Status</label>
                  <select
                    value={editingCategory.Status}
                    onChange={e => setEditingCategory({ ...editingCategory, Status: e.target.value })}
                    className="glass-input"
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button type="submit" className="glass-btn" style={{ borderRadius: '8px' }}>Update Category</button>
                  <button type="button" onClick={() => setEditingCategory(null)} className="glass-btn glass-btn-secondary" style={{ borderRadius: '8px' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCategoryAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="glass-label">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smartphones, Accessories"
                    value={categoryAddName}
                    onChange={e => setCategoryAddName(e.target.value)}
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="glass-label">Status</label>
                  <select
                    value={categoryAddStatus}
                    onChange={e => setCategoryAddStatus(e.target.value)}
                    className="glass-input"
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
                    <button onClick={() => handleCategoryDelete(c.ID, c.CategoryName)} className="glass-btn glass-btn-danger" style={{ padding: '6px 10px', borderRadius: '6px' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: BRANDS ─── */}
      {activeTab === 'brands' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Add / Edit Brand Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>
              {editingBrand ? 'Edit Brand' : 'Add New Brand'}
            </h3>

            {editingBrand ? (
              <form onSubmit={handleBrandUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="glass-label">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={editingBrand.BrandName}
                    onChange={e => setEditingBrand({ ...editingBrand, BrandName: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="glass-label">Status</label>
                  <select
                    value={editingBrand.Status}
                    onChange={e => setEditingBrand({ ...editingBrand, Status: e.target.value })}
                    className="glass-input"
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button type="submit" className="glass-btn" style={{ borderRadius: '8px' }}>Update Brand</button>
                  <button type="button" onClick={() => setEditingBrand(null)} className="glass-btn glass-btn-secondary" style={{ borderRadius: '8px' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleBrandAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="glass-label">Brand Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apple, Samsung, Google"
                    value={brandAddName}
                    onChange={e => setBrandAddName(e.target.value)}
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="glass-label">Status</label>
                  <select
                    value={brandAddStatus}
                    onChange={e => setBrandAddStatus(e.target.value)}
                    className="glass-input"
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
                    <button onClick={() => handleBrandDelete(b.ID, b.BrandName)} className="glass-btn glass-btn-danger" style={{ padding: '6px 10px', borderRadius: '6px' }}>
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
    </AdminLayout>
  );
}
