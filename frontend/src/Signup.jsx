import './css/signup.css';

import { useNavigate } from 'react-router-dom';
  
function Signup() {
    const navigate = useNavigate();

  return (
    <div className="signup-container">
      <div className="signup-left">
        <h2>Welcome to SkillBridge</h2>
        <p>
          We are so excited to have you here. If you haven't already, create an account to get
          valuable learning and real-time project experiences.
        </p>
        <button className="signin-link" onClick={() => navigate('/')}>Already have an account? Signin.</button>
      </div>

      <div className="signup-right">
        <h2>Signup</h2>
        <form>
          <input type="text" placeholder="Username" />
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <input type="password" placeholder="Confirm Password" />
          <button type="submit">Signup</button>
        </form>
        <p className="social-text">or signup with</p>
        <div className="social-icons">
          <i className="fab fa-facebook-f"></i>
          <i className="fab fa-google-plus-g"></i>
          <i className="fab fa-linkedin-in"></i>
        </div>
      </div>
    </div>
  );
}

export default Signup;
