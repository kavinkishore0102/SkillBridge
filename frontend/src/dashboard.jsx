import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ padding: '40px' }}>
      <h2>Welcome, {user.name}!</h2>
      <p>Your role: <strong>{user.role}</strong></p>

      {/* Show different UI based on role */}
      {user.role === 'student' && (
        <div>
          <h3>Student Dashboard</h3>
          <p>Here you can browse and apply for projects.</p>
        </div>
      )}

      {user.role === 'company' && (
        <div>
          <h3>Company Dashboard</h3>
          <p>Here you can post projects and review applications.</p>
        </div>
      )}

      {user.role === 'guide' && (
        <div>
          <h3>Guide Dashboard</h3>
          <p>Here you can review student submissions and provide feedback.</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
