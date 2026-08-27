import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, MapPin, Lock, Crown, ShieldAlert, 
  CheckCircle, Eye, EyeOff, Mail, KeyRound, 
  Save, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

export default function Profile() {
  const { user, token, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab State: 'personal' | 'address' | 'password'
  const [activeTab, setActiveTab] = useState('personal');

  // Sync hash or search param to tab
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (['personal', 'address', 'password'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location]);

  // General Status Messages (inline inside tab panels, no popups)
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // TAB 1: PERSONAL INFO STATE & INLINE ERRORS
  const [personalData, setPersonalData] = useState({
    firstname: '',
    lastname: '',
    mobilenumber: '',
    email: '',
    gender: 'Male',
    birthdate: ''
  });
  const [personalErrors, setPersonalErrors] = useState({});
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  // TAB 2: ADDRESS STATE & INLINE ERRORS
  const [addressData, setAddressData] = useState({
    country: 'Sri Lanka',
    street_address: '',
    city: '',
    district: 'Colombo',
    postal_code: '',
    addr_mobile: ''
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [hasExistingAddress, setHasExistingAddress] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const sriLankaDistricts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle'
  ];

  const countries = [
    'Sri Lanka', 'India', 'Australia', 'United Kingdom', 'United States',
    'Canada', 'Singapore', 'Malaysia', 'Germany', 'France'
  ];

  // TAB 3: PASSWORD & OTP STATE & INLINE ERRORS
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [otpRequested, setOtpRequested] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [simulatedOtpCode, setSimulatedOtpCode] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);

  // Calculate 12 years ago max date string for birthdate input
  const getMaxBirthdate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 12);
    return d.toISOString().split('T')[0];
  };

  // Fetch User Data & Address
  const fetchProfileData = async () => {
    if (!token) return;
    try {
      const resProf = await fetch(`${API_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resProf.ok) {
        const p = await resProf.json();
        setPersonalData({
          firstname: p.FirstName || '',
          lastname: p.LastName || '',
          mobilenumber: p.MobileNumber || '',
          email: p.Email || '',
          gender: p.Gender || 'Male',
          birthdate: p.BirthDate ? p.BirthDate.split('T')[0] : ''
        });
      }

      const resAddr = await fetch(`${API_URL}/auth/address`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resAddr.ok) {
        const a = await resAddr.json();
        if (a) {
          setHasExistingAddress(true);
          setAddressData({
            country: a.Country || 'Sri Lanka',
            street_address: a.StreetAddress || '',
            city: a.City || '',
            district: a.District || 'Colombo',
            postal_code: a.PostalCode || '',
            addr_mobile: a.MobilePhone || ''
          });
        }
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfileData();
  }, [token, authLoading]);

  // Clear messages when tab changes
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [activeTab]);

  // Validate Personal Info
  const validatePersonal = () => {
    const errors = {};
    const { firstname, lastname, mobilenumber, email, birthdate } = personalData;

    if (!firstname || !firstname.trim()) {
      errors.firstname = 'First name is required.';
    } else if (!/^[a-zA-Z\s]+$/.test(firstname.trim())) {
      errors.firstname = 'First name can only contain letters and spaces.';
    }

    if (!lastname || !lastname.trim()) {
      errors.lastname = 'Last name is required.';
    } else if (!/^[a-zA-Z\s]+$/.test(lastname.trim())) {
      errors.lastname = 'Last name can only contain letters and spaces.';
    }

    if (!mobilenumber || !mobilenumber.trim()) {
      errors.mobilenumber = 'Mobile number is required.';
    } else if (!/^0[0-9]{9}$/.test(mobilenumber.trim())) {
      errors.mobilenumber = 'Mobile number must be exactly 10 digits starting with 0.';
    }

    if (!email || !email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!birthdate) {
      errors.birthdate = 'Birth date is required.';
    } else {
      const dob = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 12) {
        errors.birthdate = 'You must be 12 years or older to register/update profile.';
      }
    }

    setPersonalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Personal Info
  const handleUpdatePersonalInfo = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validatePersonal()) {
      return;
    }

    setLoadingPersonal(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          FirstName: personalData.firstname.trim(),
          LastName: personalData.lastname.trim(),
          MobileNumber: personalData.mobilenumber.trim(),
          Email: personalData.email.trim(),
          Gender: personalData.gender,
          BirthDate: personalData.birthdate
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Profile updated successfully!');
        setPersonalErrors({});
        fetchProfileData();
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error updating profile.');
    } finally {
      setLoadingPersonal(false);
    }
  };

  // Validate Delivery Address
  const validateAddress = () => {
    const errors = {};
    const { street_address, city, district, postal_code, addr_mobile } = addressData;

    if (!addr_mobile || !addr_mobile.trim()) {
      errors.addr_mobile = 'Mobile phone is required.';
    } else if (!/^0[0-9]{9}$/.test(addr_mobile.trim())) {
      errors.addr_mobile = 'Mobile phone must be exactly 10 digits starting with 0.';
    }

    if (!street_address || !street_address.trim()) {
      errors.street_address = 'Street address is required.';
    } else if (!/^[a-zA-Z0-9\s,\.\-\/]+$/.test(street_address.trim())) {
      errors.street_address = 'Only letters, numbers, spaces, commas, periods, hyphens, and slashes are allowed.';
    }

    if (!city || !city.trim()) {
      errors.city = 'City name is required.';
    } else if (!/^[a-zA-Z\s]+$/.test(city.trim())) {
      errors.city = 'City name must contain only letters and spaces.';
    }

    if (!district || !sriLankaDistricts.includes(district)) {
      errors.district = 'Please select a valid district from the list.';
    }

    if (!postal_code || !postal_code.trim()) {
      errors.postal_code = 'Postal code is required.';
    } else if (!/^[0-9]{5}$/.test(postal_code.trim())) {
      errors.postal_code = 'Postal code must be exactly 5 digits.';
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateAddress()) {
      return;
    }

    setLoadingAddress(true);
    try {
      const res = await fetch(`${API_URL}/auth/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          Country: addressData.country,
          StreetAddress: addressData.street_address.trim(),
          City: addressData.city.trim(),
          District: addressData.district,
          PostalCode: addressData.postal_code.trim(),
          MobilePhone: addressData.addr_mobile.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Delivery address saved successfully!');
        setAddressErrors({});
        setHasExistingAddress(true);
      } else {
        setError(data.message || 'Failed to save address.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error saving address.');
    } finally {
      setLoadingAddress(false);
    }
  };

  // Validate Change Password
  const validatePassword = () => {
    const errors = {};
    const { current_password, new_password, confirm_password } = passwordData;

    if (!current_password) {
      errors.current_password = 'Current password is required.';
    }

    if (!new_password) {
      errors.new_password = 'New password is required.';
    } else if (new_password.length < 8) {
      errors.new_password = 'New password must be at least 8 characters long.';
    } else if (new_password === current_password) {
      errors.new_password = 'New password cannot be the same as current password.';
    }

    if (!confirm_password) {
      errors.confirm_password = 'Confirm password is required.';
    } else if (new_password !== confirm_password) {
      errors.confirm_password = 'New password and confirm password do not match.';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Password OTP Request
  const handleRequestPasswordOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validatePassword()) {
      return;
    }

    setLoadingOtp(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.current_password,
          newPassword: passwordData.new_password,
          confirmPassword: passwordData.confirm_password
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpRequested(true);
        setPasswordErrors({});
        setTargetEmail(data.email || personalData.email);
        if (data.simulatedOtp) {
          setSimulatedOtpCode(data.simulatedOtp);
        }
        setSuccess(data.message);
      } else {
        setError(data.message || 'Failed to initiate password change.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error requesting OTP.');
    } finally {
      setLoadingOtp(false);
    }
  };

  // Verify OTP & Update Password
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setOtpError('');

    if (!otpInput || !/^[0-9]{6}$/.test(otpInput.trim())) {
      setOtpError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoadingOtp(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: otpInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message || 'Password changed successfully!');
        setOtpRequested(false);
        setOtpInput('');
        setOtpError('');
        setPasswordErrors({});
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setOtpError(data.message || 'Invalid OTP code.');
      }
    } catch (err) {
      console.error(err);
      setOtpError('Connection error verifying OTP.');
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleCancelOtp = () => {
    setOtpRequested(false);
    setOtpInput('');
    setOtpError('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="profile-page-dark animate-fade-in py-3 mb-5">
      <div className="container">
        
        {/* Profile Hero Glass Card */}
        <div className="glass-panel p-4 mb-4 rounded-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="profile-avatar-glowing d-flex align-items-center justify-content-center">
                <User size={36} className="text-white" />
              </div>
              <div>
                <h3 className="fw-bold text-white mb-1">
                  {personalData.firstname} {personalData.lastname}
                </h3>
                <span className="text-slate-300 small d-block">{personalData.email}</span>
              </div>
            </div>

            {/* Loyalty Points Glass Badge */}
            <div className="loyalty-glass-badge p-3 rounded-4 d-flex align-items-center gap-3">
              <div className="loyalty-icon-box rounded-circle p-2 d-flex align-items-center justify-content-center">
                <Crown size={26} className="text-warning" />
              </div>
              <div>
                <span className="extra-small text-uppercase text-slate-300 fw-bold d-block">Rewards Account</span>
                <h5 className="fw-bold text-white mb-0">
                  {user?.loyaltyPoints || 0} <span className="fs-6 text-primary-light fw-semibold">Loyalty Points</span>
                </h5>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Responsive Glass Tabs Container */}
        <div className="profile-tabs-wrapper mb-4">
          <div className="d-flex flex-wrap gap-2 p-2 glass-panel rounded-4">
            <button
              className={`profile-tab-item flex-grow-1 flex-sm-grow-0 py-2.5 px-4 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <User size={18} /> Personal Info
            </button>
            <button
              className={`profile-tab-item flex-grow-1 flex-sm-grow-0 py-2.5 px-4 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'address' ? 'active' : ''}`}
              onClick={() => setActiveTab('address')}
            >
              <MapPin size={18} /> Delivery Address
            </button>
            <button
              className={`profile-tab-item flex-grow-1 flex-sm-grow-0 py-2.5 px-4 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <Lock size={18} /> Change Password
            </button>
          </div>
        </div>

        {/* TAB 1: PERSONAL INFORMATION FORM */}
        {activeTab === 'personal' && (
          <div className="glass-panel p-4 rounded-4 animate-fade-in">
            <div className="border-bottom border-slate-700 pb-3 mb-4">
              <h5 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
                <User className="text-primary-light" size={22} /> Personal Details
              </h5>
              <p className="text-slate-300 small mb-0">Manage your name, mobile contact, gender, and birthdate</p>
            </div>

            {/* Inline Error Alert */}
            {error && (
              <div className="d-flex align-items-center gap-2 p-3 mb-4 rounded-3" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', fontSize: '14px' }}>
                <AlertCircle size={20} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Inline Success Alert */}
            {success && (
              <div className="d-flex align-items-center gap-2 p-3 mb-4 rounded-3" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#4ade80', fontSize: '14px' }}>
                <CheckCircle size={20} className="flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePersonalInfo} noValidate>
              <div className="row g-3">
                
                {/* First Name */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">First Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    value={personalData.firstname}
                    onChange={(e) => {
                      setPersonalData({ ...personalData, firstname: e.target.value });
                      if (personalErrors.firstname) setPersonalErrors({ ...personalErrors, firstname: null });
                    }}
                    style={{ borderColor: personalErrors.firstname ? '#f87171' : undefined }}
                    required
                  />
                  {personalErrors.firstname && (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {personalErrors.firstname}
                    </span>
                  )}
                </div>

                {/* Last Name */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">Last Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    value={personalData.lastname}
                    onChange={(e) => {
                      setPersonalData({ ...personalData, lastname: e.target.value });
                      if (personalErrors.lastname) setPersonalErrors({ ...personalErrors, lastname: null });
                    }}
                    style={{ borderColor: personalErrors.lastname ? '#f87171' : undefined }}
                    required
                  />
                  {personalErrors.lastname && (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {personalErrors.lastname}
                    </span>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">Mobile Number <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    placeholder="07XXXXXXXX"
                    maxLength={10}
                    value={personalData.mobilenumber}
                    onChange={(e) => {
                      setPersonalData({ ...personalData, mobilenumber: e.target.value.replace(/[^0-9]/g, '') });
                      if (personalErrors.mobilenumber) setPersonalErrors({ ...personalErrors, mobilenumber: null });
                    }}
                    style={{ borderColor: personalErrors.mobilenumber ? '#f87171' : undefined }}
                    required
                  />
                  {personalErrors.mobilenumber ? (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {personalErrors.mobilenumber}
                    </span>
                  ) : (
                    <span className="extra-small text-slate-400 d-block mt-1">Exactly 10 digits starting with 0 (e.g. 0719108628)</span>
                  )}
                </div>

                {/* Gender */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">Gender <span className="text-danger">*</span></label>
                  <select
                    className="glass-input w-100"
                    value={personalData.gender}
                    onChange={(e) => setPersonalData({ ...personalData, gender: e.target.value })}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Birth Date */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">Birth Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="glass-input w-100"
                    max={getMaxBirthdate()}
                    value={personalData.birthdate}
                    onChange={(e) => {
                      setPersonalData({ ...personalData, birthdate: e.target.value });
                      if (personalErrors.birthdate) setPersonalErrors({ ...personalErrors, birthdate: null });
                    }}
                    style={{ borderColor: personalErrors.birthdate ? '#f87171' : undefined }}
                    required
                  />
                  {personalErrors.birthdate ? (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {personalErrors.birthdate}
                    </span>
                  ) : (
                    <span className="extra-small text-slate-400 d-block mt-1">You must be at least 12 years old</span>
                  )}
                </div>

                {/* Email Address */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">Email Address <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="glass-input w-100"
                    value={personalData.email}
                    onChange={(e) => {
                      setPersonalData({ ...personalData, email: e.target.value });
                      if (personalErrors.email) setPersonalErrors({ ...personalErrors, email: null });
                    }}
                    style={{ borderColor: personalErrors.email ? '#f87171' : undefined }}
                    required
                  />
                  {personalErrors.email && (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {personalErrors.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2 d-flex justify-content-end">
                <button
                  type="submit"
                  className="glass-btn px-4 py-2"
                  disabled={loadingPersonal}
                >
                  {loadingPersonal ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Save Personal Info
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: DELIVERY ADDRESS FORM */}
        {activeTab === 'address' && (
          <div className="glass-panel p-4 rounded-4 animate-fade-in">
            <div className="border-bottom border-slate-700 pb-3 mb-4">
              <h5 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
                <MapPin className="text-primary-light" size={22} /> Default Shipping Address
              </h5>
              <p className="text-slate-300 small mb-0">Update your primary delivery address for smooth checkout processing</p>
            </div>

            {/* Inline Error Alert */}
            {error && (
              <div className="d-flex align-items-center gap-2 p-3 mb-4 rounded-3" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', fontSize: '14px' }}>
                <AlertCircle size={20} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Inline Success Alert */}
            {success && (
              <div className="d-flex align-items-center gap-2 p-3 mb-4 rounded-3" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#4ade80', fontSize: '14px' }}>
                <CheckCircle size={20} className="flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} noValidate>
              <div className="row g-3">
                
                {/* Country */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">Country <span className="text-danger">*</span></label>
                  <select
                    className="glass-input w-100"
                    value={addressData.country}
                    onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                    required
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Mobile Phone */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">Mobile Phone <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    placeholder="07XXXXXXXX"
                    maxLength={10}
                    value={addressData.addr_mobile}
                    onChange={(e) => {
                      setAddressData({ ...addressData, addr_mobile: e.target.value.replace(/[^0-9]/g, '') });
                      if (addressErrors.addr_mobile) setAddressErrors({ ...addressErrors, addr_mobile: null });
                    }}
                    style={{ borderColor: addressErrors.addr_mobile ? '#f87171' : undefined }}
                    required
                  />
                  {addressErrors.addr_mobile ? (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {addressErrors.addr_mobile}
                    </span>
                  ) : (
                    <span className="extra-small text-slate-400 d-block mt-1">Recipient phone number (10 digits starting with 0)</span>
                  )}
                </div>

                {/* Street Address */}
                <div className="col-12">
                  <label className="form-label fw-semibold small text-slate-200">Street Address <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    placeholder="House No, Street Name, Locality"
                    value={addressData.street_address}
                    onChange={(e) => {
                      setAddressData({ ...addressData, street_address: e.target.value });
                      if (addressErrors.street_address) setAddressErrors({ ...addressErrors, street_address: null });
                    }}
                    style={{ borderColor: addressErrors.street_address ? '#f87171' : undefined }}
                    required
                  />
                  {addressErrors.street_address && (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {addressErrors.street_address}
                    </span>
                  )}
                </div>

                {/* City */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-slate-200">City <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    value={addressData.city}
                    onChange={(e) => {
                      setAddressData({ ...addressData, city: e.target.value });
                      if (addressErrors.city) setAddressErrors({ ...addressErrors, city: null });
                    }}
                    style={{ borderColor: addressErrors.city ? '#f87171' : undefined }}
                    required
                  />
                  {addressErrors.city && (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {addressErrors.city}
                    </span>
                  )}
                </div>

                {/* District */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-slate-200">District <span className="text-danger">*</span></label>
                  <select
                    className="glass-input w-100"
                    value={addressData.district}
                    onChange={(e) => {
                      setAddressData({ ...addressData, district: e.target.value });
                      if (addressErrors.district) setAddressErrors({ ...addressErrors, district: null });
                    }}
                    style={{ borderColor: addressErrors.district ? '#f87171' : undefined }}
                    required
                  >
                    {sriLankaDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {addressErrors.district && (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {addressErrors.district}
                    </span>
                  )}
                </div>

                {/* Postal Code */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-slate-200">Postal Code <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    placeholder="60300"
                    maxLength={5}
                    value={addressData.postal_code}
                    onChange={(e) => {
                      setAddressData({ ...addressData, postal_code: e.target.value.replace(/[^0-9]/g, '') });
                      if (addressErrors.postal_code) setAddressErrors({ ...addressErrors, postal_code: null });
                    }}
                    style={{ borderColor: addressErrors.postal_code ? '#f87171' : undefined }}
                    required
                  />
                  {addressErrors.postal_code && (
                    <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                      {addressErrors.postal_code}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2 d-flex justify-content-end">
                <button
                  type="submit"
                  className="glass-btn px-4 py-2"
                  disabled={loadingAddress}
                >
                  {loadingAddress ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> {hasExistingAddress ? 'Update Delivery Address' : 'Save Delivery Address'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: CHANGE PASSWORD (OTP WORKFLOW) */}
        {activeTab === 'password' && (
          <div className="glass-panel p-4 rounded-4 animate-fade-in">
            <div className="border-bottom border-slate-700 pb-3 mb-4">
              <h5 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
                <Lock className="text-primary-light" size={22} /> Security & Password
              </h5>
              <p className="text-slate-300 small mb-0">Change your password safely using two-step email OTP verification</p>
            </div>

            {/* OTP Security Notice Alert */}
            <div className="dark-glass-alert p-3 rounded-3 mb-4 d-flex align-items-start gap-3">
              <ShieldAlert className="text-info flex-shrink-0 mt-1" size={22} />
              <div className="small text-info-light">
                <strong className="text-white">Two-Step Security Notice:</strong> For your security, a 6-digit One-Time Password (OTP) will be sent to your registered email address (<strong className="text-white">{personalData.email}</strong>) to verify your password update request.
              </div>
            </div>

            {/* Inline Error Alert */}
            {error && (
              <div className="d-flex align-items-center gap-2 p-3 mb-4 rounded-3" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', fontSize: '14px' }}>
                <AlertCircle size={20} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Inline Success Alert */}
            {success && (
              <div className="d-flex align-items-center gap-2 p-3 mb-4 rounded-3" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#4ade80', fontSize: '14px' }}>
                <CheckCircle size={20} className="flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {!otpRequested ? (
              /* STEP 1: REQUEST OTP FORM */
              <form onSubmit={handleRequestPasswordOtp} noValidate>
                <div className="row g-3">
                  
                  {/* Current Password */}
                  <div className="col-12">
                    <label className="form-label fw-semibold small text-slate-200">Current Password <span className="text-danger">*</span></label>
                    <div className="input-password-wrapper">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        className="glass-input w-100"
                        value={passwordData.current_password}
                        onChange={(e) => {
                          setPasswordData({ ...passwordData, current_password: e.target.value });
                          if (passwordErrors.current_password) setPasswordErrors({ ...passwordErrors, current_password: null });
                        }}
                        style={{ borderColor: passwordErrors.current_password ? '#f87171' : undefined }}
                        required
                      />
                      <button
                        type="button"
                        className="pw-toggle-btn"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                      >
                        {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordErrors.current_password && (
                      <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                        {passwordErrors.current_password}
                      </span>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-slate-200">New Password <span className="text-danger">*</span></label>
                    <div className="input-password-wrapper">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        className="glass-input w-100"
                        placeholder="At least 8 characters"
                        value={passwordData.new_password}
                        onChange={(e) => {
                          setPasswordData({ ...passwordData, new_password: e.target.value });
                          if (passwordErrors.new_password) setPasswordErrors({ ...passwordErrors, new_password: null });
                        }}
                        style={{ borderColor: passwordErrors.new_password ? '#f87171' : undefined }}
                        required
                      />
                      <button
                        type="button"
                        className="pw-toggle-btn"
                        onClick={() => setShowNewPw(!showNewPw)}
                      >
                        {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordErrors.new_password && (
                      <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                        {passwordErrors.new_password}
                      </span>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-slate-200">Confirm New Password <span className="text-danger">*</span></label>
                    <div className="input-password-wrapper">
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        className="glass-input w-100"
                        value={passwordData.confirm_password}
                        onChange={(e) => {
                          setPasswordData({ ...passwordData, confirm_password: e.target.value });
                          if (passwordErrors.confirm_password) setPasswordErrors({ ...passwordErrors, confirm_password: null });
                        }}
                        style={{ borderColor: passwordErrors.confirm_password ? '#f87171' : undefined }}
                        required
                      />
                      <button
                        type="button"
                        className="pw-toggle-btn"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                      >
                        {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordErrors.confirm_password && (
                      <span className="text-danger mt-1 d-block" style={{ fontSize: '12.5px', color: '#f87171' }}>
                        {passwordErrors.confirm_password}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2 d-flex justify-content-end">
                  <button
                    type="submit"
                    className="glass-btn px-4 py-2"
                    disabled={loadingOtp}
                  >
                    {loadingOtp ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Mail size={18} /> Get OTP & Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: VERIFY OTP FORM */
              <div className="otp-dark-card p-4 rounded-4 border text-center my-3">
                <div className="otp-icon-wrapper mx-auto mb-3 rounded-circle p-3 d-inline-flex">
                  <KeyRound size={32} className="text-primary-light" />
                </div>
                <h5 className="fw-bold text-white mb-2">Enter Verification Code</h5>
                <p className="text-slate-300 small max-w-lg mx-auto mb-3">
                  We have sent a 6-digit verification code (OTP) to your registered email: <br />
                  <strong className="text-white">{targetEmail}</strong>
                </p>

                {simulatedOtpCode && (
                  <div className="dev-otp-badge py-2 px-3 rounded-pill mb-3 d-inline-block">
                    Dev Mode OTP: <strong className="text-white">{simulatedOtpCode}</strong>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="max-w-xs mx-auto" noValidate>
                  <div className="mb-4">
                    <input
                      type="text"
                      className="glass-input text-center fw-bold letter-spacing-lg w-100"
                      placeholder="000000"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => {
                        setOtpInput(e.target.value.replace(/[^0-9]/g, ''));
                        if (otpError) setOtpError('');
                      }}
                      style={{ borderColor: otpError ? '#f87171' : undefined }}
                      required
                    />
                    {otpError && (
                      <span className="text-danger mt-2 d-block text-center" style={{ fontSize: '12.5px', color: '#f87171' }}>
                        {otpError}
                      </span>
                    )}
                  </div>

                  <div className="d-flex justify-content-center align-items-center gap-3">
                    <button
                      type="button"
                      className="glass-btn-secondary px-4 py-2 rounded-pill"
                      onClick={handleCancelOtp}
                      disabled={loadingOtp}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="glass-btn px-4 py-2 rounded-pill"
                      disabled={loadingOtp}
                    >
                      {loadingOtp ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} /> Verify & Update Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
