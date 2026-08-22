import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Logo from '../images/my-logo.png';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <div className="navbar-logo">
          <img src={Logo} className="logo-icon" alt="logo" />
          <Link to="/" className="logo-text">Movie Explorer</Link>
        </div>

        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Home
          </NavLink>
          <NavLink to="/BrowseMovies" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Browse Movies
          </NavLink>
          <NavLink to="/AboutUs" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            About Us
          </NavLink>
          <NavLink to="/ContactUs" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Contact Us
          </NavLink>
          
          <div className="login-wrapper">
            {user ? (
              <div className="user-profile-menu">
                <Avatar sx={{ bgcolor: '#ff007f', width: 32, height: 32, fontSize: '0.9rem', fontWeight: 600 }}>
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
                <span className="navbar-username">{user.username}</span>
                <Button 
                  onClick={handleLogout}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: '20px',
                    borderColor: '#ff3e6c',
                    color: '#ff3e6c',
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: '2px 12px',
                    fontSize: '0.8rem',
                    '&:hover': {
                      borderColor: '#e50914',
                      background: 'rgba(255, 62, 108, 0.08)',
                    }
                  }}
                >
                  Log Out
                </Button>
              </div>
            ) : (
              <Link to="/Login" style={{ textDecoration: 'none' }}>
                <Button
                  variant="contained"
                  sx={{
                    borderRadius: '25px',
                    padding: '5px 18px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #ff3e6c 0%, #ff007f 100%)',
                    color: '#ffffff',
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(255, 0, 127, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ff007f 0%, #e50914 100%)',
                      boxShadow: '0 6px 15px rgba(255, 0, 127, 0.5)',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  Log In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
