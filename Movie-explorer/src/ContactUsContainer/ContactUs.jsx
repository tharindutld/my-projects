import React, { useState } from 'react';


const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Assuming form submission to a backend or third-party service
    if (formData.name && formData.email && formData.message) {
      setFormStatus('Thank you for reaching out! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } else {
      setFormStatus('Please fill out all the fields.');
    }
  };

  return (
    <div className="contactus-container">
      <header className="contactus-header">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you. Reach out to us for any questions or support!</p>
      </header>

      <section className="contactus-info">
        <div className="contactus-details">
          <h2>Our Office</h2>
          <p>📍 No. 247, Main Street, Colombo</p>
          <p>📞 +94 011 123 4567</p>
          <p>📧 info@movieexplorer.com</p>
        </div>

        <div className="contactus-form">
          <h2>Send Us a Message</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              className="contactus-input"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              className="contactus-input"
            />
            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              className="contactus-textarea"
            ></textarea>
            <button type="submit" className="contactus-submit">Submit</button>
          </form>
          {formStatus && <p className="form-status">{formStatus}</p>}
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
