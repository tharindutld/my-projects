
import React from 'react';
import { Container, Typography, Card, CardContent, Grid, Box } from '@mui/material';


const AboutCard = ({ title, description }) => (
  <Grid item xs={12} sm={6} md={4}>
    <Card className="about-card" elevation={6}>
      <CardContent>
        <Typography variant="h6" className="card-title">{title}</Typography>
        <Typography variant="body2" className="card-desc">{description}</Typography>
      </CardContent>
    </Card>
  </Grid>
);

const AboutUs = () => {
  return (
    <Container maxWidth="lg" className="about-container">
      <Typography variant="h3" className="about-heading" gutterBottom>
        About SoapyRide 🚗✨
      </Typography>
      <Typography variant="body1" className="about-intro">
        At SoapyRide, we go beyond basic car cleaning. With eco-friendly products, a dedicated team, and cutting-edge technology, we make sure your car not only shines—but smiles!
      </Typography>

      <Box mt={5}>
        <Grid container spacing={4}>
          <AboutCard
            title="Eco-Friendly Products"
            description="We use biodegradable and safe products that are kind to your car and the planet."
          />
          <AboutCard
            title="Affordable Packages"
            description="Choose from a variety of packages that suit your budget without compromising on quality."
          />
          <AboutCard
            title="Expert Staff"
            description="Our trained professionals treat your vehicle with the same care and love as their own."
          />
        </Grid>
      </Box>
    </Container>
  );
};

export default AboutUs;
