import React from 'react';
import {
  Facebook,
  Instagram,
  Twitter,
  YouTube,
  KeyboardArrowUp,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Grid,
  Link,
  IconButton,
  Fab,
  Container,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const FooterCard = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box component="footer" className="footer-root">
      <Container maxWidth="lg">
        <Grid container spacing={6} justifyContent="space-between">
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h5" className="footer-brand">
              Movie Explorer
            </Typography>
            <Typography variant="body2">
              Discover. Watch. Repeat.
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" className="footer-heading">
              Quick Links
            </Typography>
            <Box className="footer-links">
              <Link
                component={RouterLink}
                to="/"
                underline="hover"
                className="footer-link"
              >
                Home
              </Link>
              <Link
                component={RouterLink}
                to="/AboutUs"
                underline="hover"
                className="footer-link"
              >
                About Us
              </Link>
              <Link
                component={RouterLink}
                to="/BrowseMovies"
                underline="hover"
                className="footer-link"
              >
                Browser Movies
              </Link>
              <Link
                component={RouterLink}
                to="/ContactUs"
                underline="hover"
                className="footer-link"
              >
                Contact Us
              </Link>
              
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={4}>
            <Typography variant="h6" className="footer-heading">
              Contact
            </Typography>
            <Typography variant="body2">
              📍 No. 247, Main Street, Colombo
            </Typography>
            <Typography variant="body2">
              📞 +94 011 123 4567
            </Typography>
            <Typography variant="body2">
              📧 info@movieexplorer.com
            </Typography>
            <Box className="social-icons">
              {[Facebook, Instagram, Twitter, YouTube].map((Icon, i) => (
                <IconButton key={i} href="#" className="social-icon">
                  <Icon />
                </IconButton>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Box className="footer-bottom">
          <Typography variant="caption">
            &copy; {new Date().getFullYear()} Movie Explorer. All rights reserved.
          </Typography>
        </Box>
      </Container>

      <Fab
        onClick={scrollToTop}
        size="medium"
        className="scroll-to-top"
        aria-label="scroll to top"
      >
        <KeyboardArrowUp />
      </Fab>
    </Box>
  );
};

export default FooterCard;
