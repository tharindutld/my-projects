import "./Login.css";
import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="login-container">
      <h2>Login</h2>

      <form className="login-form">
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />

        <button className="btn">Login</button>
      </form>

      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;
