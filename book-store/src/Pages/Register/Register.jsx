
import "./Register.css";
import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="register-container">
      <h2>Create Account</h2>

      <form className="register-form">
        <input type="text" placeholder="Full Name" required />
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />

        <button className="btn">Register</button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;
