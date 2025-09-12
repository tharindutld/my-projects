import './App.css';
import Navbar from './NavbarComponents/Navbar';
import Footer from '../src/LowestContainer/Footer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './Pages/LandingPage';
import SignInPage from './Pages/SignInPage';
import RegistrationPage from './Pages/RegistrationPage';
import AboutUsPage from './Pages/AboutUsPage';
import ContactUsPage from './Pages/ContactUsPage';
import ServicesPage from './Pages/ServicesPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LearnMorePage from './Pages/LearnMorePage';
import BookingFormPage from './Pages/BookingFormPage';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider> {/* Wrap everything with AuthProvider */}
        <div className='App'>
          <Navbar />
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/registration" element={<RegistrationPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/service" element={<ServicesPage />} />
            <Route path="/learnmore" element={<LearnMorePage />} />
            <Route path="/bookingform" element={<BookingFormPage />} />
          </Routes>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
