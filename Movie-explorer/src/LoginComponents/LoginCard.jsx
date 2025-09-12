
import React, { useState } from 'react';
import {Container, TextField, Box, Typography, IconButton, InputAdornment, FormControlLabel, Checkbox, Link, Button} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';


const LoginCard = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });

    
     const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

     const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Sign In:', form);
   
  };

  return (
    <Container maxWidth="xs">
            
    <Box  sx={{ mt: 10, p: 4, bgcolor: '#f0f8ff', borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h5" align="center" mb={3}>
                    Welcome to the <strong>Movie Explorer</strong>
                </Typography>
        <form onSubmit={handleSubmit}>
                <TextField  label="Email" name="email" variant="standard" 
                    required 
                    fullWidth 
                    margin="normal"
                    value={form.email}
                    onChange={handleChange}
        
                />
                <TextField  label="Password" name="password" variant="standard" 
                    required 
                    fullWidth 
                    margin="normal"
                    value={form.password}
                    onChange={handleChange}
                    type={showPassword ? 'text' : 'password'}
                    
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
                display="flex" justifyContent="flex-start"
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Link href="#" variant="body2">
              Forgot password?
            </Link>
            <Link href="/signup" variant="body2">
              Sign Up
            </Link>
          </Box>


        </form>
    </Box>
    
    </Container>

  );
};

export default LoginCard;
