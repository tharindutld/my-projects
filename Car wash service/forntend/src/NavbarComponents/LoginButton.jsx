import React from 'react';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

function LoginButton() {

    const navigate = useNavigate();

    const handleSignIn = () => {
      navigate('/signin');
  };

    return(
        <div >
            <Button variant="outlined" sx={
                {borderRadius:'50px',
                    backgroundColor: '#0082fe',
                 marginTop:'8px',
                 fontWeight: '700',
                 color:'#ffffff',
                 '&:hover':{
                    backgroundColor:'#3951c5',
                    borderColor:'#3951c5',
                    boxShadow:'0 4px 15px rgba(13, 53, 241, 1)',
                    color:'whitesmoke',
                 } 
                }
                
                } onClick={handleSignIn} className="signin-btn">
                
                Log In</Button>
        </div>
    )
}

export default LoginButton;