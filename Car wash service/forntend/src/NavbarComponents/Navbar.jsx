import React from 'react';
import Logo from '../images/my-logo.png';
import LoginButton from './LoginButton';
import BookingButton from '../BookingContainer/BookingButton';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { isLoggedIn, userName } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userName');
    navigate('/');
    window.location.reload(); // Simple way to force a refresh
  };

  return (
    <div>
      <nav>
        <div className='logo-img'>
          <img src={Logo} className="logo-icon" alt="logo" />
          
           <Link to='/'><a href="#" className="logo">SoapyRide</a></Link>
        </div>

        <div className="dropdowns">
          <div className="dropdown">
            <Link to='/'><button className="dropdown-button"><span>HOME</span></button></Link>
          </div>

          <div className="dropdown">
            <Link to='/service'><button className="dropdown-button"><span>SERVICES</span></button></Link>
          </div>

          <div className="dropdown">
            <Link to='/about'><button className="dropdown-button"><span>ABOUT US</span></button></Link>
          </div>

          <div className="dropdown">
            <Link to='/contact'><button className="dropdown-button"><span>CONTACT US</span></button></Link>
          </div>

          {isLoggedIn && <BookingButton />}

          {/* ✅ Auth Status Display */}
          {isLoggedIn ? (
            <>
              {userName && (
                <span className="welcome-msg">Welcome, {userName || 'User'} !</span>
              ) }
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) :  (
            <LoginButton />
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
