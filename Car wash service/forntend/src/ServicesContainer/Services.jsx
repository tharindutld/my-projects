import React from 'react';
import { Container, Grid, Typography, Box } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import PaintIcon from '@mui/icons-material/FormatPaint';
import TuneIcon from '@mui/icons-material/Tune';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import imagetwo from '../images/image-two.jpg';


const services = [
  { title: 'Car Wash', icon: <DirectionsCarIcon />, description: 'Comprehensive exterior and interior cleaning.' },
  { title: 'Car Checking', icon: <CheckCircleIcon />, description: 'Detailed inspection to ensure safety.' },
  { title: 'Car Service', icon: <BuildIcon />, description: 'Routine maintenance and repairs.' },
  { title: 'Car Modifying', icon: <SettingsIcon />, description: 'Custom upgrades to improve performance.' },
  { title: 'Car Painting', icon: <PaintIcon />, description: 'High-quality painting and finishing.' },
  { title: 'Wheel Alignment', icon: <TuneIcon />, description: 'Precise wheel alignment for safety.' },
];

const packages = [
  {
    title: 'Basic Wash',
    price: 'Rs. 1,500',
    features: ['Exterior Wash', 'Tire Cleaning', 'Quick Dry'],
  },
  {
    title: 'Premium Wax',
    price: 'Rs. 3,000',
    features: ['Basic Wash +', 'Wax Coating', 'Dashboard Polish', 'Wheel Shine'],
  },
  {
    title: 'Interior Detailing',
    price: 'Rs. 5,000',
    features: ['Deep Interior Clean', 'Shampoo Seats', 'Air Freshener', 'Full Vacuum'],
  },
];

const Services = () => {
  return (
    <Container className="new-service-container">
      <Typography variant="h3" className="page-title">
        Our Services
      </Typography>

      <Typography variant="body1" className="common-description" paragraph>
        We provide a wide range of professional car services designed to keep your vehicle in top condition,
        enhance its performance, and make it look great. Our experienced team is committed to delivering quality
        and satisfaction.
      </Typography>

      <Box className="image-box">
        <img src={imagetwo} alt="Car and man" className="main-image" />
      </Box>

      <Grid container spacing={4} className="services-grid">
        {services.map(({ title, icon, description }) => (
          <Grid item xs={12} sm={6} md={4} key={title}>
            <Box className="service-card">
              <Box className="icon-wrapper">{icon}</Box>
              <Typography variant="h6" className="service-title">{title}</Typography>
              <Typography variant="body2" className="service-description">{description}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h4" className="package-title"> Our Service Packages</Typography>
      <Grid container spacing={4} className="packages-grid">
        {packages.map(({ title, price, features }) => (
          <Grid item xs={12} sm={6} md={4} key={title}>
            <Box className="package-card">
              <Typography variant="h6" className="package-name">{title}</Typography>
              <Typography className="package-price">{price}</Typography>
              <ul className="feature-list">
                {features.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Services;
