import React from 'react';
import { Link } from 'react-router-dom';
import LoginButton from './LoginButton';
import Logo from '../images/my-logo.png';


function Navbar() {
  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <div className="navbar-logo">
          <img src={Logo} className="logo-icon" alt="logo" />
          <Link to="/" className="logo-text">Movie Explorer</Link>
        </div>

        <div className="navbar-links">
          <Link to="/"><button className="nav-btn">Home</button></Link>
          <Link to="/AboutUs"><button className="nav-btn">About Us</button></Link>
          <Link to="/BrowseMovies"><button className="nav-btn">Browse Movies</button></Link>
          <Link to="/ContactUs"><button className="nav-btn">Contact Us</button></Link>
            <div className="login-wrapper">
                <LoginButton />
            </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
