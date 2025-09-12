import React from 'react';
import { Box, Typography, Grid, IconButton, Fab, Container } from '@mui/material';
import {
  Facebook,
  Instagram,
  Twitter,
  YouTube,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ bgcolor: '#023e8a', color: '#fff', pt: 6, pb: 8, mt: 5 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {/* Brand */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h5" sx={{ color: '#90e0ef', mb: 1 }}>
              SoapyRide
            </Typography>
            <Typography variant="body2">
              Freshen your ride with care and shine.
            </Typography>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" sx={{ color: '#ade8f4', mb: 1 }}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link to='/' href="#home" underline="hover" color="inherit" className="link-custom">
                Home
              </Link>
              <Link to='/service' href="#services" underline="hover" color="inherit" className="link-custom">
                Services
              </Link>
              <Link to='/about' href="#about" underline="hover" color="inherit" className="link-custom">
                About Us
              </Link>
              <Link to='/contact' href="#contact" underline="hover" color="inherit" className="link-custom">
                Contact Us
              </Link>
            </Box>
          </Grid>

          {/* Contact + Social */}
          <Grid item xs={12} sm={12} md={4}>
            <Typography variant="h6" sx={{ color: '#ade8f4', mb: 1 }}>
              Contact
            </Typography>
            <Typography variant="body2">📍  No. 247, Main Street, Colombo</Typography>
            <Typography variant="body2">📞  +94 011 123 4567</Typography>
            <Typography variant="body2">📧  info@soapyride.com</Typography>

            <Box sx={{ mt: 2 }}>
              <IconButton href="#" sx={{ color: '#fff' }}>
                <Facebook />
              </IconButton>
              <IconButton href="#" sx={{ color: '#fff' }}>
                <Instagram />
              </IconButton>
              <IconButton href="#" sx={{ color: '#fff' }}>
                <Twitter />
              </IconButton>
              <IconButton href="#" sx={{ color: '#fff' }}>
                <YouTube />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Footer Bottom */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="caption" color="#bde0fe">
            &copy; {new Date().getFullYear()} SoapyRide. All rights reserved.
          </Typography>
        </Box>
      </Container>

      {/* Scroll to Top */}
      <Fab
        onClick={scrollToTop}
        size="small"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          bgcolor: '#0077b6',
          color: 'white',
          '&:hover': {
            bgcolor: '#023e8a',
          },
        }}
        aria-label="scroll to top"
      >
        <KeyboardArrowUp />
      </Fab>
    </Box>
  );
};

export default Footer;
