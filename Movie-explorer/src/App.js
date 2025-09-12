
import React from 'react';
import './App.css';
import Navbar from './NavbarComponents/Navbar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './Pages/LoginPage';
import LandingPage from './Pages/LandingPage'
import FooterCard from './FooterContainer/FooterCard'; 
import AboutUsPage from './Pages/AboutUsPage';
import ContactUsPage from './Pages/ContactUsPage';
import BrowseMoviesPage from './Pages/BrowseMoviesPage';


function App() {
  return (
    <Router>
        <div className='App'>
            <Navbar/>
           
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/Login" element={<LoginPage />} />
                <Route path="/AboutUs" element={<AboutUsPage />} />
                <Route path="/ContactUs" element={<ContactUsPage />} />
                <Route path="/BrowseMovies" element={<BrowseMoviesPage />} />
              </Routes>
              
            <FooterCard/>
        </div>
    </Router>
    
  );
}

export default App;
