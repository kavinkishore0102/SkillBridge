import './css/login.css';
import { useNavigate } from 'react-router-dom';
function Login() {
    const navigate = useNavigate();
  return (
    <div className="container">
      <div className="login-form">
        <h2>Login</h2>
        <form>
          <input type="text" placeholder="Username" />
          <input type="password" placeholder="Password" />
          <button type="submit">Login</button>
        </form>
        <p className="social-text">or signin with</p>
        <div className="social-icons">
          <i className="fab fa-facebook-f"></i>
          <i className="fab fa-google-plus-g"></i>
          <i className="fab fa-linkedin-in"></i>
        </div>
      </div>
      <div className="login-info">
        <h2>Welcome back!</h2>
        <p>
          Welcome back! We are so happy to have you here. It's great to see you again.
          
        </p>
        <button className="signup-btn" onClick={() => navigate('/signup')}>No account yet? Signup.</button>
      </div>
    </div>
  );
}

export default Login;
