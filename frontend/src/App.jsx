import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Navbar from './components/Navbar';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './UserDashboard';
import Projects from './Projects';
import Profile from './Profile';
import EditProfile from './EditProfile';
import AppliedProjects from './AppliedProjects';
import ProjectDetails from './ProjectDetails';
import PostProject from './PostProject';
import Submissions from './Submissions';
import './styles/professional.css';

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/signup';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isAuthPage && <Navbar />}
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/applied-projects" element={<AppliedProjects />} />
          <Route path="/post-project" element={<PostProject />} />
          <Route path="/submissions" element={<Submissions />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Router>
          <AppContent />
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
