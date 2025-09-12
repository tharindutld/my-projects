import React from 'react';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

function LoginButton() {
  const navigate = useNavigate();

  const handleLogIn = () => {
    navigate('/Login');
  };

  return (
    <div className="login-btn-wrapper">
      <Button
        variant="contained"
        sx={{
          borderRadius: '25px',
          padding: '6px 20px',
          fontWeight: 600,
          background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
          color: '#ffffff',
          textTransform: 'none',
          boxShadow: '0 4px 12px rgba(106, 17, 203, 0.4)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
            boxShadow: '0 6px 15px rgba(78, 0, 200, 0.5)',
            transform: 'scale(1.05)',
          },
        }}
        onClick={handleLogIn}
      >
        Log In
      </Button>
    </div>
  );
}

export default LoginButton;
