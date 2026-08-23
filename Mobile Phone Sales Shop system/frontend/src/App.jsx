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
import AddBrand from './pages/AddBrand';
import ManageBrand from './pages/ManageBrand';
import EditBrand from './pages/EditBrand';
import AddCategory from './pages/AddCategory';
import ManageCategory from './pages/ManageCategory';
import EditCategory from './pages/EditCategory';
import AddProduct from './pages/AddProduct';
import ManageProduct from './pages/ManageProduct';
import EditProduct from './pages/EditProduct';
import Inventory from './pages/Inventory';
import AddStock from './pages/AddStock';
import StockList from './pages/StockList';

// Order Pages
import AddOrder from './pages/AddOrder';
import UserOrders from './pages/UserOrders';
import MyOrders from './pages/MyOrders';
import ManageOrders from './pages/ManageOrders';

// Repair Pages
import AddRepair from './pages/AddRepair';
import ManageRepair from './pages/ManageRepair';
import EditRepair from './pages/EditRepair';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Routes>
        {/* Dashboard Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/dashboard.php" element={<AdminDashboard />} />
        <Route path="/admin/index.php" element={<AdminDashboard />} />

        {/* Brand Routes */}
        <Route path="/admin/add-brand" element={<AddBrand />} />
        <Route path="/admin/add-brand.php" element={<AddBrand />} />
        <Route path="/admin/add_brand.php" element={<AddBrand />} />
        <Route path="/admin/manage-brand" element={<ManageBrand />} />
        <Route path="/admin/manage-brand.php" element={<ManageBrand />} />
        <Route path="/admin/manage_brand.php" element={<ManageBrand />} />
        <Route path="/admin/edit-brand/:id" element={<EditBrand />} />
        <Route path="/admin/edit-brand.php" element={<EditBrand />} />
        <Route path="/admin/edit_brand.php" element={<EditBrand />} />

        {/* Category Routes */}
        <Route path="/admin/add-category" element={<AddCategory />} />
        <Route path="/admin/add-category.php" element={<AddCategory />} />
        <Route path="/admin/add_category.php" element={<AddCategory />} />
        <Route path="/admin/manage-category" element={<ManageCategory />} />
        <Route path="/admin/manage-category.php" element={<ManageCategory />} />
        <Route path="/admin/manage_category.php" element={<ManageCategory />} />
        <Route path="/admin/edit-category/:id" element={<EditCategory />} />
        <Route path="/admin/edit-category.php" element={<EditCategory />} />
        <Route path="/admin/edit_category.php" element={<EditCategory />} />

        {/* Product Routes */}
        <Route path="/admin/add-product" element={<AddProduct />} />
        <Route path="/admin/add-product.php" element={<AddProduct />} />
        <Route path="/admin/add_product.php" element={<AddProduct />} />
        <Route path="/admin/manage-product" element={<ManageProduct />} />
        <Route path="/admin/manage-product.php" element={<ManageProduct />} />
        <Route path="/admin/manage_product.php" element={<ManageProduct />} />
        <Route path="/admin/editproducts/:id" element={<EditProduct />} />
        <Route path="/admin/editproducts.php" element={<EditProduct />} />
        <Route path="/admin/edit-product/:id" element={<EditProduct />} />
        <Route path="/admin/edit-product.php" element={<EditProduct />} />
        <Route path="/admin/edit_product.php" element={<EditProduct />} />

        {/* Inventory & Stock Routes */}
        <Route path="/admin/inventory" element={<Inventory />} />
        <Route path="/admin/inventory.php" element={<Inventory />} />
        <Route path="/admin/add-stock" element={<AddStock />} />
        <Route path="/admin/add-stock.php" element={<AddStock />} />
        <Route path="/admin/add_stock.php" element={<AddStock />} />
        <Route path="/admin/stock" element={<StockList />} />
        <Route path="/admin/stock-list" element={<StockList />} />
        <Route path="/admin/stock-list.php" element={<StockList />} />
        <Route path="/admin/stock_list.php" element={<StockList />} />

        {/* Order Routes */}
        <Route path="/admin/add-order" element={<AddOrder />} />
        <Route path="/admin/add-order.php" element={<AddOrder />} />
        <Route path="/admin/add_order.php" element={<AddOrder />} />
        <Route path="/admin/orders" element={<ManageOrders />} />
        <Route path="/admin/orders.php" element={<ManageOrders />} />
        <Route path="/admin/manage-orders" element={<ManageOrders />} />
        <Route path="/admin/manage_orders.php" element={<ManageOrders />} />
        <Route path="/admin/user-orders" element={<UserOrders />} />
        <Route path="/admin/user-orders/:uid" element={<UserOrders />} />
        <Route path="/admin/user-orders.php" element={<UserOrders />} />
        <Route path="/admin/user_orders.php" element={<UserOrders />} />

        {/* Repair Routes */}
        <Route path="/admin/add-repair" element={<AddRepair />} />
        <Route path="/admin/add-repair.php" element={<AddRepair />} />
        <Route path="/admin/add_repair.php" element={<AddRepair />} />
        <Route path="/admin/manage-repair" element={<ManageRepair />} />
        <Route path="/admin/manage-repair.php" element={<ManageRepair />} />
        <Route path="/admin/manage-repairs" element={<ManageRepair />} />
        <Route path="/admin/manage-repairs.php" element={<ManageRepair />} />
        <Route path="/admin/repairs" element={<ManageRepair />} />
        <Route path="/admin/repairs.php" element={<ManageRepair />} />
        <Route path="/admin/edit-repair/:id" element={<EditRepair />} />
        <Route path="/admin/edit-repair.php" element={<EditRepair />} />
        <Route path="/admin/edit_repair.php" element={<EditRepair />} />

        {/* Sales, Pricing, Staff, Reports, Users */}
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/pricing" element={<AdminPricing />} />
        <Route path="/admin/pricing.php" element={<AdminPricing />} />
        <Route path="/admin/staff" element={<AdminStaff />} />
        <Route path="/admin/staff.php" element={<AdminStaff />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/reports.php" element={<AdminReports />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users.php" element={<AdminUsers />} />

        {/* Catch-all Fallback for Admin Routes */}
        <Route path="/admin/*" element={<AdminDashboard />} />
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
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-orders.php" element={<MyOrders />} />
          <Route path="/my_orders.php" element={<MyOrders />} />
          <Route path="/my_orders" element={<MyOrders />} />
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
