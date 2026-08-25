import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'
];

export default function CategoryModal({ isOpen, onClose, onSave, categories = [] }) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setName('');
    setSelectedColor('#6366f1');
    setErrorMsg('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (val.trim() && categories.some((c) => c.name.toLowerCase() === val.trim().toLowerCase())) {
      setErrorMsg('A project tag with this name already exists.');
    } else {
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('Project tag name is required.');
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('A project tag with this name already exists.');
      return;
    }

    try {
      await onSave({ name: trimmed, color: selectedColor, icon: 'folder' });
      setName('');
      setErrorMsg('');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save project tag.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800 }}>
            New Project Tag
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Category / Project Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Design System, Finance, Marketing"
              value={name}
              onChange={handleNameChange}
              style={{ border: errorMsg ? '1px solid #ef4444' : undefined }}
              autoFocus
            />
            {errorMsg && (
              <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block', fontWeight: 500 }}>
                ⚠️ {errorMsg}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Color Badge</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginTop: '0.25rem' }}>
              {COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    border: selectedColor === color ? '2px solid white' : 'none',
                    boxShadow: selectedColor === color ? '0 0 10px rgba(255,255,255,0.4)' : 'none'
                  }}
                >
                  {selectedColor === color && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!!errorMsg}>
              Add Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
