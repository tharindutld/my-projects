import React, { useState } from 'react';
import {
  Container, Box, TextField, Button, Typography,
  FormControlLabel, Checkbox, InputAdornment, IconButton, Link
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';  // <-- Correct named import
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const SignInPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/login', form);

      // Store token + user full name
      localStorage.setItem('jwtToken', res.data.token);
      localStorage.setItem('userName', res.data.user.fullname || res.data.user.name || '');

      refreshAuth(); // Update auth state immediately

      const decoded = jwtDecode(res.data.token);
      console.log('Decoded token:', decoded);

      setSuccess(true);
      setError('');

      // Redirect based on role
      if (decoded.role === 'admin') {
        navigate('/createPost');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login failed:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Login failed');
      setSuccess(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 10, p: 4, bgcolor: '#f0f8ff', borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h5" align="center" mb={3}>
          Welcome Back to <strong>SoapyRide</strong>
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            name="email"
            fullWidth
            required
            margin="normal"
            value={form.email}
            onChange={handleChange}
          />

          <TextField
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            required
            margin="normal"
            value={form.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControlLabel
            control={<Checkbox color="primary" />}
            label="Remember me"
            sx={{ mt: 1 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, bgcolor: '#023e8a', '&:hover': { bgcolor: '#0077b6' } }}
          >
            Log In
          </Button>

          {error && (
            <Typography color="error" mt={2} align="center">
              {error}
            </Typography>
          )}

          {success && (
            <Typography color="success.main" mt={2} align="center">
              Login successful!
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Link href="#" variant="body2">
              Forgot password?
            </Link>
            <Link href="/registration" variant="body2">
              Sign Up
            </Link>
          </Box>
        </form>
      </Box>
    </Container>
  );
};

export default SignInPage;
