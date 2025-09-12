import React, { useState } from 'react';
import {
  Container,
  Grid,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [formStatus, setFormStatus] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('jwtToken');
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;


    if (!token) {
      setFormStatus('❌ You must be logged in to submit a message.');
      return;
    }

    if (formData.name && formData.email && formData.message) {
      try {
        await axios.post('http://localhost:5000/post-messages-jwt', formData);

        setFormStatus('✅ Message sent successfully!');
        setFormData({ name: '', email: '', message: '' });

        // Automatically hide the message after 3 seconds
        setTimeout(() => {
        setFormStatus('');
      }, 3000);


        navigate('/contact');
      } catch (err) {
        setError(err.response?.data?.message || 'Something went wrong.');
      }
    } else {
      setFormStatus('⚠️ Please fill out all the fields.');
    }
  };

  return (
    <Container className="contactus-container" maxWidth="md">
      <Paper elevation={4} className="contactus-paper">
        <Typography variant="h4" className="contactus-header" sx={{ fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }} gutterBottom>
          Contact Us
        </Typography>
        <Typography variant="body1" className="contactus-subtext">
          We'd love to hear from you. Reach out to us for any questions or support!
        </Typography>

        <Box className="contactus-info" mt={4}>
          <Grid container spacing={4}>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Send Us a Message
              </Typography>
              <form onSubmit={handleSubmit} className="contactus-form">
                <TextField
                  label="Your Name"
                  variant="outlined"
                  fullWidth
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  margin="normal"
                />

                <TextField 
                  label="Your Email"
                  variant="outlined"
                  fullWidth
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  type="email"
                />

                <TextField
                  label="Your Message"
                  variant="outlined"
                  fullWidth
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={4}
                />
                <Box textAlign="center" mt={2}>
                  <Button className='contactus-submit'
                    variant="contained"
                    color="primary"
                    type="submit"
                  >
                    Submit
                  </Button>
                </Box>
              </form>

              {formStatus && (
                <Typography sx={{ mt: 2, color: 'green' }}>
                  {formStatus}
                </Typography>
              )}
              {error && (
                <Typography sx={{ mt: 2, color: 'red' }}>
                  {error}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default ContactUs;
