// src/components/InputField.jsx
import React, { useState } from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const InputField = ({ label, type, name, value, onChange, error, helperText }) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';

  return (
    <TextField
      label={label}
      type={isPassword ? (showPassword ? 'text' : 'password') : type}
      name={name}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      fullWidth
      margin="normal"
      variant="outlined"
      InputProps={
        isPassword
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }
          : undefined
      }
    />
  );
};

export default InputField;
