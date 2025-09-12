import React, { useState } from 'react';
import { Container, Typography, Button, Box, Paper, FormControlLabel, Checkbox } from '@mui/material';
import InputField from './InputField';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const RegistrationPage = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agree: false,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
  const { name, value, type, checked } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value
  }));

  setErrors('');  // Reset error on change
};


  const validate = () => {
    const newErrors = {};
    if (!formData.fullname) newErrors.fullname = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agree) newErrors.agree = 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validate();
  if (!isValid) return; // Stop submission if form has validation errors
        try {
            await axios.post('http://localhost:5000/register', formData);
            toast.success('Registration successful! Redirecting to login...', {
                position: 'top-center',
                autoClose: 2000,
            });
            console.log('Registration successful');

            setErrors('');  // Reset error on success
            setFormData({
              fullname: '',
              email: '',
              phone: '',
              password: '',
              confirmPassword: '',
              agree: false
              });

          setTimeout(() => {
            navigate('/signin');
          }, 2000); // wait 2s before redirecting

        } catch (err) {
            console.error('Registration failed', err.response.data);
            setErrors(err.response.data.message);  // Set error message
        }
  };

  return (
    <div className="reg-bg">
      <Container maxWidth="xs">
        <Paper elevation={5} className="reg-card">
          <Typography variant="h5" className="reg-title">
            Welcome to Registration
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <InputField name="fullname" label="Full Name" value={formData.fullname} onChange={handleChange} error={!!errors.fullName} helperText={errors.fullName} />
            <InputField name="email" label="Email" type="email" value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} />
            <InputField name="phone" label="Phone Number" type="tel" value={formData.phone} onChange={handleChange} error={!!errors.phone} helperText={errors.phone} />
            <InputField name="password" label="Password" type="password" value={formData.password} onChange={handleChange} error={!!errors.password} helperText={errors.password} />
            <InputField name="confirmPassword" label="Confirm Password" type="password" value={formData.confirmPassword} onChange={handleChange} error={!!errors.confirmPassword} helperText={errors.confirmPassword} />

            <FormControlLabel
              control={<Checkbox checked={formData.agree} onChange={handleChange} name="agree" />}
              label="I agree to the Terms & Conditions"
            />
            {errors.agree && <Typography variant="caption" color="error">{errors.agree}</Typography>}

            <Button type="submit" fullWidth variant="contained" className="reg-btn">
              submit
            </Button>
            {errors.general && (
  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
    {errors.general}
  </Typography>
)}

          </Box>
        </Paper>
      </Container>
    </div>
  );
};

export default RegistrationPage;
