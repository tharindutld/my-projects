import React, { useState, useContext } from 'react';
import { Container, TextField, Box, Typography, IconButton, InputAdornment, Button, Alert, Link } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const RegisterCard = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Username validation: letters and spaces only (no numbers or special characters)
    const usernameRegex = /^[a-zA-Z\s]+$/;
    if (!usernameRegex.test(form.username.trim())) {
      setError("Username can only contain letters and spaces (no numbers or special characters).");
      return;
    }

    // Email validation: must contain exactly one '@' sign
    const emailParts = form.email.split('@');
    if (emailParts.length !== 2) {
      setError("Email must contain exactly one '@' character.");
      return;
    }

    // Standard email pattern check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await register(form.username, form.email, form.password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Custom textfield styling to perfectly fit the dark cinematic theme
  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      color: 'var(--text-primary)',
      '& fieldset': { borderColor: 'var(--border-color)' },
      '&:hover fieldset': { borderColor: 'var(--text-muted)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--accent)' },
    },
    '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
    '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent)' },
    '& .MuiIconButton-root': { color: 'var(--text-secondary)' },
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ 
        mt: 10, 
        p: 4, 
        bgcolor: 'var(--bg-card)', 
        borderRadius: 3, 
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)'
      }}>
        <Typography variant="h5" align="center" mb={3} sx={{ fontWeight: 700 }}>
          Create an Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            name="username"
            variant="outlined"
            required
            fullWidth
            margin="normal"
            value={form.username}
            onChange={handleChange}
            sx={textFieldStyle}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            variant="outlined"
            required
            fullWidth
            margin="normal"
            value={form.email}
            onChange={handleChange}
            sx={textFieldStyle}
          />
          <TextField
            label="Password"
            name="password"
            variant="outlined"
            required
            fullWidth
            margin="normal"
            value={form.password}
            onChange={handleChange}
            type={showPassword ? 'text' : 'password'}
            sx={textFieldStyle}
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
          <TextField
            label="Confirm Password"
            name="confirmPassword"
            variant="outlined"
            required
            fullWidth
            margin="normal"
            value={form.confirmPassword}
            onChange={handleChange}
            type={showPassword ? 'text' : 'password'}
            sx={textFieldStyle}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ 
              mt: 3, 
              background: 'linear-gradient(135deg, var(--accent) 0%, #ff007f 100%)', 
              '&:hover': { background: 'linear-gradient(135deg, #ff007f 0%, var(--accent-hover) 100%)' }, 
              borderRadius: '25px', 
              padding: '10px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(255, 62, 108, 0.2)'
            }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Typography variant="body2" color="var(--text-secondary)">
              Already have an account?{' '}
              <Link component={RouterLink} to="/Login" style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 'bold' }}>
                Log In
              </Link>
            </Typography>
          </Box>
        </form>
      </Box>
    </Container>
  );
};

export default RegisterCard;
