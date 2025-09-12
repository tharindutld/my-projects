// src/Pages/LearnMorePage.jsx
import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';


const LearnMore = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" className="learn-more-container">
      <Box className="learn-more-box">
        <Typography variant="h3" gutterBottom className="learn-more-title">
          Learn More About SoapyRide
        </Typography>

        <Typography variant="body1" className="learn-more-text">
          SoapyRide is your one-stop solution for professional car washing services. We use high-quality
          eco-friendly products and modern equipment to give your car a sparkling clean finish. Our team
          is dedicated to ensuring your satisfaction with every visit.
        </Typography>

        <Typography variant="body1" className="learn-more-text">
          We offer a variety of packages tailored to suit your car cleaning needs — from basic exterior
          washes to complete interior detailing. Our commitment to excellence, convenience, and customer
          care sets us apart in the industry.
        </Typography>

        <Typography variant="body1" className="learn-more-text">
          Join our loyalty program and get exclusive discounts, offers, and reminders so your car never
          misses a clean-up.
        </Typography>

        <Button variant="contained" color="primary" className="learn-more-button" onClick={() => navigate('/')}>Return to Home</Button>
      </Box>
    </Container>
  );
};

export default LearnMore;
