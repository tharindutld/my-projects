import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, MapPin, Lock, Crown, ShieldAlert, 
  CheckCircle, Eye, EyeOff, Mail, KeyRound, 
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ToastAlert from '../components/ToastAlert';
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

  // Global Alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // TAB 1: PERSONAL INFO STATE
  const [personalData, setPersonalData] = useState({
    firstname: '',
    lastname: '',
    mobilenumber: '',
    email: '',
    gender: 'Male',
    birthdate: ''
  });
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  // TAB 2: ADDRESS STATE
  const [addressData, setAddressData] = useState({
    country: 'Sri Lanka',
    street_address: '',
    city: '',
    district: 'Colombo',
    postal_code: '',
    addr_mobile: ''
  });
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

  // TAB 3: PASSWORD & OTP STATE
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [otpRequested, setOtpRequested] = useState(false);
  const [otpInput, setOtpInput] = useState('');
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

  // Submit Personal Info
  const handleUpdatePersonalInfo = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { firstname, lastname, mobilenumber, email, gender, birthdate } = personalData;

    if (!firstname || !lastname || !mobilenumber || !email || !birthdate) {
      setError('Please fill in all personal information fields.');
      return;
    }

    if (!/^0[0-9]{9}$/.test(mobilenumber)) {
      setError('Mobile number must be exactly 10 digits starting with 0.');
      return;
    }

    const dob = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 12) {
      setError('You must be 12 years or older to register/update profile.');
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
          FirstName: firstname,
          LastName: lastname,
          MobileNumber: mobilenumber,
          Email: email,
          Gender: gender,
          BirthDate: birthdate
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Profile updated successfully!');
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

  // Submit Address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { country, street_address, city, district, postal_code, addr_mobile } = addressData;

    if (!/^0[0-9]{9}$/.test(addr_mobile)) {
      setError('Mobile phone must be exactly 10 digits starting with 0.');
      return;
    }

    if (!sriLankaDistricts.includes(district)) {
      setError('Please select a valid district from the list.');
      return;
    }

    if (!/^[0-9]{5}$/.test(postal_code)) {
      setError('Postal code must be exactly 5 digits.');
      return;
    }

    if (!/^[a-zA-Z0-9\s,\.\-\/]+$/.test(street_address)) {
      setError('Street address contains invalid characters. Only letters, numbers, spaces, commas, periods, hyphens, and slashes are allowed.');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(city)) {
      setError('City name must contain only letters and spaces.');
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
          Country: country,
          StreetAddress: street_address,
          City: city,
          District: district,
          PostalCode: postal_code,
          MobilePhone: addr_mobile
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Delivery address saved successfully!');
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

  // Submit Password OTP Request
  const handleRequestPasswordOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { current_password, new_password, confirm_password } = passwordData;

    if (!current_password || !new_password || !confirm_password) {
      setError('All password fields are required.');
      return;
    }

    if (new_password !== confirm_password) {
      setError('New passwords do not match.');
      return;
    }

    if (new_password.length < 8) {
      setError('New password must be at least 8 characters.');
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
          currentPassword: current_password,
          newPassword: new_password,
          confirmPassword: confirm_password
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpRequested(true);
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

    if (!otpInput || otpInput.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
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
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setError(data.message || 'Invalid OTP code.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error verifying OTP.');
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleCancelOtp = () => {
    setOtpRequested(false);
    setOtpInput('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="profile-page-dark animate-fade-in py-3 mb-5">
      <ToastAlert message={error} type="danger" onClose={() => setError('')} />
      <ToastAlert message={success} type="success" onClose={() => setSuccess('')} />

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

            <form onSubmit={handleUpdatePersonalInfo}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">First Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    pattern="[a-zA-Z\s]+"
                    title="Letters only."
                    value={personalData.firstname}
                    onChange={(e) => setPersonalData({ ...personalData, firstname: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">Last Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    pattern="[a-zA-Z\s]+"
                    title="Letters only."
                    value={personalData.lastname}
                    onChange={(e) => setPersonalData({ ...personalData, lastname: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">Mobile Number <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    placeholder="07XXXXXXXX"
                    maxLength={10}
                    minLength={10}
                    pattern="0[0-9]{9}"
                    title="Must be exactly 10 digits starting with 0"
                    value={personalData.mobilenumber}
                    onChange={(e) => setPersonalData({ ...personalData, mobilenumber: e.target.value.replace(/[^0-9]/g, '') })}
                    required
                  />
                  <span className="extra-small text-slate-400 d-block mt-1">Exactly 10 digits starting with 0 (e.g. 0719108628)</span>
                </div>

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

                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">Birth Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="glass-input w-100"
                    max={getMaxBirthdate()}
                    value={personalData.birthdate}
                    onChange={(e) => setPersonalData({ ...personalData, birthdate: e.target.value })}
                    required
                  />
                  <span className="extra-small text-slate-400 d-block mt-1">You must be at least 12 years old</span>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">Email Address <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="glass-input w-100"
                    value={personalData.email}
                    onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                    required
                  />
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

            <form onSubmit={handleSaveAddress}>
              <div className="row g-3">
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

                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-slate-200">Mobile Phone <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    placeholder="07XXXXXXXX"
                    maxLength={10}
                    minLength={10}
                    pattern="0[0-9]{9}"
                    title="Must be exactly 10 digits starting with 0"
                    value={addressData.addr_mobile}
                    onChange={(e) => setAddressData({ ...addressData, addr_mobile: e.target.value.replace(/[^0-9]/g, '') })}
                    required
                  />
                  <span className="extra-small text-slate-400 d-block mt-1">Recipient phone number (10 digits starting with 0)</span>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold small text-slate-200">Street Address <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    placeholder="House No, Street Name, Locality"
                    pattern="[a-zA-Z0-9\s,\.\-\/]+"
                    title="Only alphanumeric characters, spaces, commas, periods, hyphens, and slashes are allowed"
                    value={addressData.street_address}
                    onChange={(e) => setAddressData({ ...addressData, street_address: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-slate-200">City <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    pattern="[a-zA-Z\s]+"
                    title="Only letters and spaces are allowed"
                    value={addressData.city}
                    onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-slate-200">District <span className="text-danger">*</span></label>
                  <select
                    className="glass-input w-100"
                    value={addressData.district}
                    onChange={(e) => setAddressData({ ...addressData, district: e.target.value })}
                    required
                  >
                    {sriLankaDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold small text-slate-200">Postal Code <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="glass-input w-100"
                    placeholder="60300"
                    maxLength={5}
                    minLength={5}
                    pattern="[0-9]{5}"
                    title="Postal code must be exactly 5 digits"
                    value={addressData.postal_code}
                    onChange={(e) => setAddressData({ ...addressData, postal_code: e.target.value.replace(/[^0-9]/g, '') })}
                    required
                  />
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

            {!otpRequested ? (
              /* STEP 1: REQUEST OTP FORM */
              <form onSubmit={handleRequestPasswordOtp}>
                <div className="row g-3">
                  
                  {/* Current Password */}
                  <div className="col-12">
                    <label className="form-label fw-semibold small text-slate-200">Current Password <span className="text-danger">*</span></label>
                    <div className="input-password-wrapper">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        className="glass-input w-100"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
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
                  </div>

                  {/* New Password */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-slate-200">New Password <span className="text-danger">*</span></label>
                    <div className="input-password-wrapper">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        className="glass-input w-100"
                        minLength={8}
                        placeholder="At least 8 characters"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
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
                  </div>

                  {/* Confirm New Password */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-slate-200">Confirm New Password <span className="text-danger">*</span></label>
                    <div className="input-password-wrapper">
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        className="glass-input w-100"
                        minLength={8}
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
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

                <form onSubmit={handleVerifyOtp} className="max-w-xs mx-auto">
                  <div className="mb-4">
                    <input
                      type="text"
                      className="glass-input text-center fw-bold letter-spacing-lg w-100"
                      placeholder="000000"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                    />
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
