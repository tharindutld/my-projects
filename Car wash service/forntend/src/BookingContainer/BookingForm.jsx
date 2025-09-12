// BookingForm.jsx
import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BookingForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formStatus, setFormStatus] = useState('');

  const initialValues = {
    name: '',
    phone: '',
    date: '',
    time: '',
    vehicleType: '',
    washPackage: '',
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, 'Phone must be 10 digits')
      .required('Phone number is required'),
    date: Yup.date().required('Date is required'),
    time: Yup.string().required('Time is required'),
    vehicleType: Yup.string().required('Please select a vehicle type'),
    washPackage: Yup.string(),
  });

  const onSubmit = async (values, { resetForm }) => {
    const token = localStorage.getItem('jwtToken');

    if (!token) {
      setFormStatus('❌ You must be logged in to make a booking.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/bookings-jwt',
        values,
        {
          headers: {
            Authorization: 'Bearer ' + token,
          },
        }
      );

      console.log('Response from server:', response.data);

      setFormStatus(`✅ ${response.data.status}`);
      setError('');
      resetForm();
      setTimeout(() => setFormStatus(''), 5000);
      // navigate('/'); // Optional: redirect after success
    } catch (err) {
      setError(err.response?.data?.message || '❌ Something went wrong.');
    }
  };

  return (
    <div className="booking-form-container">
      <h2>Book a Wash</h2>
      {formStatus && <div style={{ color: 'green' }}>{formStatus}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
        <Form className="booking-form">
          <div>
            <label htmlFor="name">Name</label>
            <Field type="text" name="name" className="input" />
            <ErrorMessage name="name" component="div" className="error" />
          </div>

          <div>
            <label htmlFor="phone">Phone Number</label>
            <Field type="text" name="phone" className="input" />
            <ErrorMessage name="phone" component="div" className="error" />
          </div>

          <div>
            <label htmlFor="date">Date</label>
            <Field type="date" name="date" className="input" />
            <ErrorMessage name="date" component="div" className="error" />
          </div>

          <div>
            <label htmlFor="time">Time</label>
            <Field type="time" name="time" className="input" />
            <ErrorMessage name="time" component="div" className="error" />
          </div>

          <div>
            <label htmlFor="vehicleType">Vehicle Type</label>
            <Field as="select" name="vehicleType" className="input">
              <option value="">Select</option>
              <option value="Car">Car</option>
              <option value="SUV">SUV</option>
              <option value="Van">Van</option>
              <option value="Bike">Bike</option>
            </Field>
            <ErrorMessage name="vehicleType" component="div" className="error" />
          </div>

          <div>
            <label htmlFor="washPackage">Wash Package (Optional)</label>
            <Field as="select" name="washPackage" className="input">
              <option value="">Select</option>
              <option value="Basic Wash">Basic Wash</option>
              <option value="Premium Wash">Premium Wash</option>
              <option value="Detailing">Detailing</option>
            </Field>
          </div>

          <button type="submit">Book Now</button>
        </Form>
      </Formik>
    </div>
  );
};

export default BookingForm;
