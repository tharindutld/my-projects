// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

// Pages
import Home from "./Pages/Home/Home";
import Books from "./Pages/Books/Books";
import BookDetails from "./Pages/BookDetails/BookDetails";
import Cart from "./Pages/Cart/Cart";
import Login from "./Pages/Login/Login";
import Register from "./Pages/Register/Register";

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/:id" element={<BookDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;
