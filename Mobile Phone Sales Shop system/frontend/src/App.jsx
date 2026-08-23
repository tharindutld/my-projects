import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Customer Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Invoice from './pages/Invoice';
import LostPassword from './pages/LostPassword';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminRepairs from './pages/AdminRepairs';
import AdminStock from './pages/AdminStock';
import AdminProducts from './pages/AdminProducts';
import AdminPricing from './pages/AdminPricing';
import AdminStaff from './pages/AdminStaff';
import AdminInventory from './pages/AdminInventory';
import AdminReports from './pages/AdminReports';
import AdminUsers from './pages/AdminUsers';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/repairs" element={<AdminRepairs />} />
        <Route path="/admin/stock" element={<AdminStock />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/pricing" element={<AdminPricing />} />
        <Route path="/admin/staff" element={<AdminStaff />} />
        <Route path="/admin/inventory" element={<AdminInventory />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Routes>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flexGrow: 1, padding: '20px 0' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/invoice/:id" element={<Invoice />} />
          <Route path="/lost-password" element={<LostPassword />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
