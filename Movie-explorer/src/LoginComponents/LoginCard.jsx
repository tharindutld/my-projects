import React, { useState, useContext } from 'react';
import { Container, TextField, Box, Typography, IconButton, InputAdornment, FormControlLabel, Checkbox, Link, Button, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../utils/api';

const LoginCard = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // View mode toggles between 'login' and 'forgot'
  const [viewMode, setViewMode] = useState('login');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await login(form.email, form.password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        email: resetEmail,
        password: newPassword
      });
      setSuccess(res.data.message || 'Password reset successfully!');
      setResetEmail('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
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
        {viewMode === 'login' ? (
          <>
            <Typography variant="h5" align="center" mb={3} sx={{ fontWeight: 700 }}>
              Welcome to <span style={{ color: 'var(--accent)' }}>Movie Explorer</span>
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
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

              <FormControlLabel
                control={<Checkbox sx={{ color: 'var(--border-color)', '&.Mui-checked': { color: 'var(--accent)' } }} />}
                label="Remember me"
                sx={{ mt: 1, display: 'flex', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}
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
                {loading ? 'Logging In...' : 'Log In'}
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Link 
                  component="button" 
                  type="button"
                  variant="body2" 
                  onClick={() => { setViewMode('forgot'); setError(''); setSuccess(''); }}
                  sx={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
                >
                  Forgot password?
                </Link>
                <Link 
                  component={RouterLink} 
                  to="/Register" 
                  variant="body2" 
                  sx={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}
                >
                  Sign Up
                </Link>
              </Box>
            </form>
          </>
        ) : (
          <>
            <Typography variant="h5" align="center" mb={2} sx={{ fontWeight: 700 }}>
              Reset Password
            </Typography>
            <Typography variant="body2" color="var(--text-secondary)" align="center" mb={3}>
              Verify your registered email and enter your new password to reset it.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleResetSubmit}>
              <TextField
                label="Registered Email"
                type="email"
                variant="outlined"
                required
                fullWidth
                margin="normal"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                sx={textFieldStyle}
              />
              <TextField
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                required
                fullWidth
                margin="normal"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                required
                fullWidth
                margin="normal"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
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
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Link 
                  component="button" 
                  type="button"
                  variant="body2" 
                  onClick={() => { setViewMode('login'); setError(''); setSuccess(''); }}
                  sx={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}
                >
                  Back to Log In
                </Link>
              </Box>
            </form>
          </>
        )}
      </Box>
    </Container>
  );
};

export default LoginCard;
