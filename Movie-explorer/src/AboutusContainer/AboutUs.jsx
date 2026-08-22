import React from 'react';
import tld from '../images/tld.png'
import amr from '../images/amr.png'
import gayatra from '../images/gayatra.png'

const team = [
  {
    name: 'Tharindu Dissanayake',
    role: 'Founder & CEO',
    img: tld, // Ensure this image exists in public/images/
  },
  {
    name: 'Amal Ranawaka',
    role: 'Fullstack Developer',
    img: amr,
  },
  {
    name: 'Gayathra Ariyathilake',
    role: 'UI/UX Designer',
    img: gayatra,
  },
];

const AboutUs = () => {
  return (
    <div className="aboutus-container">
      <header className="aboutus-header">
        <h1>About Movie Explorer</h1>
        <p>Discover movies, explore cast & crew, and stay updated with the latest releases. Built with passion for film enthusiasts!</p>
      </header>

      <section className="aboutus-story">
        <h2>Our Story</h2>
        <p>
          Movie Explorer was born from a desire to bring movie lovers a better way to search, explore, and enjoy cinema. Our mission is to provide a beautiful, fast, and informative experience by combining the best of design and technology.
        </p>
        <p>
          Whether you're a casual viewer or a hardcore film buff, Movie Explorer helps you stay on top of trending titles, hidden gems, and timeless classics. We're constantly improving to bring you the features you want most.
        </p>
      </section>

      <section className="aboutus-team">
        <h2>Meet the Team</h2>
        <div className="aboutus-grid">
          {team.map((member, index) => (
            <div key={index} className="aboutus-card">
              <img src={member.img} alt={member.name} className="aboutus-avatar" />
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
