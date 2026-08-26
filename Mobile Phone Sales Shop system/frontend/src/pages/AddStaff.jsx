import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, Eye, EyeOff, User, Mail, Phone, Calendar, Shield, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ToastAlert from '../components/ToastAlert';
import ConfirmModal from '../components/ConfirmModal';

export default function AddStaff() {
  const { token, API_URL } = useAuth();
  const navigate = useNavigate();

  // Calculate max birth date (18 years ago from today)
  const today = new Date();
  const maxBirthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0];

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    birthDate: '',
    role: '',
    status: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState({ type: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const nameRegex = /^[a-zA-Z\s]+$/;

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required.';
    } else if (!nameRegex.test(formData.firstName.trim()) || formData.firstName.trim().length < 2 || formData.firstName.trim().length > 50) {
      errors.firstName = 'First name must contain only letters and spaces (2-50 characters).';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required.';
    } else if (!nameRegex.test(formData.lastName.trim()) || formData.lastName.trim().length < 2 || formData.lastName.trim().length > 50) {
      errors.lastName = 'Last name must contain only letters and spaces (2-50 characters).';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (!/^0[0-9]{9}$/.test(formData.phone.trim())) {
      errors.phone = 'Phone number must be exactly 10 digits starting with 0.';
    }

    if (!formData.gender) {
      errors.gender = 'Please select a gender.';
    }

    if (!formData.birthDate) {
      errors.birthDate = 'Please select a birth date.';
    } else {
      const birth = new Date(formData.birthDate);
      if (birth > today) {
        errors.birthDate = 'Birth date cannot be in the future.';
      } else {
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        if (age < 18) {
          errors.birthDate = 'Staff member must be at least 18 years old.';
        }
      }
    }

    if (!formData.role) {
      errors.role = 'Please select a role.';
    }

    if (!formData.status) {
      errors.status = 'Please select a status.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitAttempt = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setToast({ type: 'error', message: 'Please fix the highlighted errors in the form.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Staff Registration',
      message: `Are you sure you want to add ${formData.firstName} ${formData.lastName} as a staff member?`,
      onConfirm: executeAddStaff
    });
  };

  const executeAddStaff = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      const res = await fetch(`${API_URL}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          gender: formData.gender,
          birth_date: formData.birthDate,
          role: formData.role,
          status: formData.status,
          password: formData.password
        })
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: 'Staff member added successfully.' });
        setTimeout(() => navigate('/admin/staff'), 1200);
      } else {
        setToast({ type: 'error', message: data.message || 'Failed to add staff member.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network or server error occurred.' });
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid py-4 animate-fade-in" style={{ maxWidth: '1000px' }}>
        {toast.message && (
          <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Top Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <span style={{
              fontSize: '12px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#38bdf8',
              background: 'rgba(56,189,248,0.12)',
              padding: '4px 12px',
              borderRadius: '20px',
              display: 'inline-block',
              marginBottom: '8px'
            }}>Staff Administration</span>
            <h1 className="text-white fw-bold m-0 d-flex align-items-center gap-2" style={{ fontSize: '26px' }}>
              <UserPlus style={{ color: '#818cf8' }} size={28} /> Add New Staff Member
            </h1>
          </div>

          <Link to="/admin/staff" className="glass-btn glass-btn-secondary" style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '10px 18px' }}>
            <ArrowLeft size={16} /> Back to Staff Directory
          </Link>
        </div>

        {/* Main Glass Form Container */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '36px', 
            borderRadius: '20px', 
            background: 'rgba(15, 23, 42, 0.85)', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}
        >
          <form noValidate onSubmit={handleSubmitAttempt}>
            <div className="row g-4">
              
              {/* First Name */}
              <div className="col-md-6">
                <label className="form-label text-light fw-semibold" style={{ fontSize: '13px' }}>
                  First Name <span className="text-danger">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="firstName"
                    className={`custom-glass-input w-100 ${fieldErrors.firstName ? 'border-danger' : ''}`}
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                    style={{ paddingLeft: '38px' }}
                  />
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
                {fieldErrors.firstName && (
                  <div className="mt-1" style={{ color: '#f87171', fontSize: '12px', fontWeight: '500' }}>
                    {fieldErrors.firstName}
                  </div>
                )}
              </div>

              {/* Last Name */}
              <div className="col-md-6">
                <label className="form-label text-light fw-semibold" style={{ fontSize: '13px' }}>
                  Last Name <span className="text-danger">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="lastName"
                    className={`custom-glass-input w-100 ${fieldErrors.lastName ? 'border-danger' : ''}`}
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    style={{ paddingLeft: '38px' }}
                  />
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
                {fieldErrors.lastName && (
                  <div className="mt-1" style={{ color: '#f87171', fontSize: '12px', fontWeight: '500' }}>
                    {fieldErrors.lastName}
                  </div>
                )}
              </div>

              {/* Email Address */}
              <div className="col-md-6">
                <label className="form-label text-light fw-semibold" style={{ fontSize: '13px' }}>
                  Email Address <span className="text-danger">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    name="email"
                    className={`custom-glass-input w-100 ${fieldErrors.email ? 'border-danger' : ''}`}
                    placeholder="example@mail.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ paddingLeft: '38px' }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
                {fieldErrors.email && (
                  <div className="mt-1" style={{ color: '#f87171', fontSize: '12px', fontWeight: '500' }}>
                    {fieldErrors.email}
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div className="col-md-6">
                <label className="form-label text-light fw-semibold" style={{ fontSize: '13px' }}>
                  Phone Number <span className="text-danger">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="phone"
                    className={`custom-glass-input w-100 ${fieldErrors.phone ? 'border-danger' : ''}`}
                    placeholder="07xxxxxxxx"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ paddingLeft: '38px' }}
                  />
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                </div>
                {fieldErrors.phone && (
                  <div className="mt-1" style={{ color: '#f87171', fontSize: '12px', fontWeight: '500' }}>
                    {fieldErrors.phone}
                  </div>
                )}
              </div>

              {/* Gender */}
              <div className="col-md-6">
                <label className="form-label text-light fw-semibold" style={{ fontSize: '13px' }}>
                  Gender <span className="text-danger">*</span>
                </label>
                <select
                  name="gender"
                  className={`custom-glass-input w-100 ${fieldErrors.gender ? 'border-danger' : ''}`}
                  value={formData.gender}
                  onChange={handleChange}
                  style={{ color: formData.gender ? '#ffffff' : '#94a3b8' }}
                >
                  <option value="" disabled style={{ background: '#0f172a', color: '#94a3b8' }}>Choose Gender...</option>
                  <option value="Male" style={{ background: '#0f172a', color: '#ffffff' }}>Male</option>
                  <option value="Female" style={{ background: '#0f172a', color: '#ffffff' }}>Female</option>
                </select>
                {fieldErrors.gender && (
                  <div className="mt-1" style={{ color: '#f87171', fontSize: '12px', fontWeight: '500' }}>
                    {fieldErrors.gender}
                  </div>
                )}
              </div>

              {/* Birth Date */}
              <div className="col-md-6">
                <label className="form-label text-light fw-semibold" style={{ fontSize: '13px' }}>
                  Birth Date <span className="text-danger">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    name="birthDate"
                    max={maxBirthDate}
                    className={`custom-glass-input w-100 ${fieldErrors.birthDate ? 'border-danger' : ''}`}
                    value={formData.birthDate}
                    onChange={handleChange}
                  />
                </div>
                {fieldErrors.birthDate && (
                  <div className="mt-1" style={{ color: '#f87171', fontSize: '12px', fontWeight: '500' }}>
                    {fieldErrors.birthDate}
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="col-md-6">
                <label className="form-label text-light fw-semibold" style={{ fontSize: '13px' }}>
                  Role <span className="text-danger">*</span>
                </label>
                <select
                  name="role"
                  className={`custom-glass-input w-100 ${fieldErrors.role ? 'border-danger' : ''}`}
                  value={formData.role}
                  onChange={handleChange}
                  style={{ color: formData.role ? '#ffffff' : '#94a3b8' }}
                >
                  <option value="" disabled style={{ background: '#0f172a', color: '#94a3b8' }}>Choose Role...</option>
                  <option value="Admin" style={{ background: '#0f172a', color: '#ffffff' }}>Admin</option>
                  <option value="Sales person" style={{ background: '#0f172a', color: '#ffffff' }}>Sales person</option>
                  <option value="Technician" style={{ background: '#0f172a', color: '#ffffff' }}>Technician</option>
                </select>
                {fieldErrors.role && (
                  <div className="mt-1" style={{ color: '#f87171', fontSize: '12px', fontWeight: '500' }}>
                    {fieldErrors.role}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="col-md-6">
                <label className="form-label text-light fw-semibold" style={{ fontSize: '13px' }}>
                  Status <span className="text-danger">*</span>
                </label>
                <select
                  name="status"
                  className={`custom-glass-input w-100 ${fieldErrors.status ? 'border-danger' : ''}`}
                  value={formData.status}
                  onChange={handleChange}
                  style={{ color: formData.status ? '#ffffff' : '#94a3b8' }}
                >
                  <option value="" disabled style={{ background: '#0f172a', color: '#94a3b8' }}>Choose Status...</option>
                  <option value="Active" style={{ background: '#0f172a', color: '#ffffff' }}>Active</option>
                  <option value="Inactive" style={{ background: '#0f172a', color: '#ffffff' }}>Inactive</option>
                </select>
                {fieldErrors.status && (
                  <div className="mt-1" style={{ color: '#f87171', fontSize: '12px', fontWeight: '500' }}>
                    {fieldErrors.status}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="col-md-6">
                <label className="form-label text-light fw-semibold" style={{ fontSize: '13px' }}>
                  Password <span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`custom-glass-input w-100 ${fieldErrors.password ? 'border-danger' : ''}`}
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    style={{ paddingLeft: '38px', paddingRight: '42px' }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#cbd5e1',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <div className="mt-1" style={{ color: '#f87171', fontSize: '12px', fontWeight: '500' }}>
                    {fieldErrors.password}
                  </div>
                )}
              </div>

            </div>

            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '32px 0 24px 0' }} />

            {/* Buttons */}
            <div className="d-flex justify-content-end gap-3">
              <button
                type="button"
                className="glass-btn glass-btn-secondary"
                style={{ padding: '10px 24px', borderRadius: '10px', fontSize: '13px' }}
                onClick={() => navigate('/admin/staff')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glass-btn glass-btn-primary"
                style={{ padding: '10px 28px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}
              >
                <CheckCircle size={16} /> Save Staff Member
              </button>
            </div>

          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
