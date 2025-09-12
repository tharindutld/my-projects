import React from 'react';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

function BookingButton() {

    const navigate = useNavigate();

    const handleSignIn = () => {
      navigate('/bookingform');
  };

    return(
        <div >
            <Button variant="outlined" sx={
                {borderRadius:'50px',
                    backgroundColor: '#0082fe',
                 marginTop:'8px',
                 fontWeight: '700',
                color: '#ffffff',
                backgroundColor: '#ff6b6b', // base color
                borderColor: '#ff6b6b',
                '&:hover': {
                backgroundColor: '#e63946',
                borderColor: '#e63946',
                boxShadow: '0 4px 15px rgba(230, 57, 70, 0.7)',
                color: '#ffffff'


                 } 
                }
                
                } onClick={handleSignIn} className="signin-btn">
                
                Book Us</Button>
        </div>
    )
}

export default BookingButton;