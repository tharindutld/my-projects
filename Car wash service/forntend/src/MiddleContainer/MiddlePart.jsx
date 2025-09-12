import React from 'react';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

const MiddlePart = () => {

  const navigate = useNavigate();

  const handleSignInRegister = () => {
    navigate('/registration');
    };
  const handleSignInLearnMore = () => {
    navigate('/learnmore');
    };
   


  return (
      <div className='middle-container'>
          <h3>BEST CAR WASH</h3>
          <p>Easily Use Stunning Effects.</p>
              <div>
                  <h2>F R E S H E N  &nbsp; Y O U R  &nbsp; R I D E</h2>
              </div>

              <div className='middle-container-buttons'>
              <Button variant="outlined" sx={
                {borderRadius: '50px',
                    backgroundColor: '#ff7451',
                    padding: '0.6rem 2rem',
                    fontWeight: 700,
                    color: '#000000',
                    borderColor: '#ff7451',
                    transition: 'all 0.3s ease',
                 '&:hover':{
                    backgroundColor: '#ff7451',
                    borderColor: '#ff7451',
                    boxShadow: '0 4px 15px rgba(255, 116, 81, 0.5)',
                    color: 'white',
                    
                 } 
                }
                
                } onClick={handleSignInRegister} className="registration-btn">
                
                Register</Button>

                <Button variant="outlined" sx={
                { borderRadius: '50px',
                    backgroundColor: '#ff7451',
                    padding: '0.6rem 2rem',
                    fontWeight: 700,
                    color: '#000000',
                    borderColor: '#ff7451',
                    transition: 'all 0.3s ease',
                 '&:hover':{
                    backgroundColor: '#ff7451',
                    borderColor: '#ff7451',
                    boxShadow: '0 4px 15px rgba(255, 116, 81, 0.5)',
                    color: 'white',
                    
                 } 
                }
                
                } onClick={handleSignInLearnMore} className="learnmore-btn" >
                
                Learn More</Button>
              </div>


              
      </div>

    
  )
}

export default MiddlePart;
