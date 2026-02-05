import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';
import { utils, chatAPI } from './utils/api';

function PendingConfirmations() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const user = utils.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    // Allow only guides to access this page
    if (user.role !== 'guide') {
      navigate('/dashboard');
      return;
    }

    fetchPendingConfirmations();
  }, [navigate]);

  const fetchPendingConfirmations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await chatAPI.getPendingConfirmations();
      console.log('Pending confirmations response:', response);
      setPendingRequests(response.pending_requests || []);
    } catch (err) {
      console.error('Failed to fetch pending confirmations:', err);
      setError(err.message || 'Failed to load pending confirmations');
      addNotification('Failed to load pending confirmations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRequest = async (requestId, action) => {
    try {
      setProcessingId(requestId);
      const response = await chatAPI.confirmConnection(requestId, action);
      console.log('Confirmation response:', response);

      addNotification(
        action === 'accept' 
          ? 'Student connection approved!' 
          : 'Student connection rejected',
        'success'
      );

      // Refresh the list
      await fetchPendingConfirmations();
    } catch (err) {
      console.error('Failed to confirm connection:', err);
      addNotification(err.message || 'Failed to process request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const containerStyle = {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
    minHeight: '100vh',
  };

  const headerStyle = {
    marginBottom: '2rem',
    color: theme === 'dark' ? '#fff' : '#333',
  };

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  };

  const subtitleStyle = {
    fontSize: '0.95rem',
    color: theme === 'dark' ? '#aaa' : '#666',
  };

  const requestCardStyle = {
    backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: theme === 'dark' 
      ? '0 2px 8px rgba(0,0,0,0.3)' 
      : '0 2px 8px rgba(0,0,0,0.1)',
  };

  const studentInfoStyle = {
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  };

  const avatarStyle = {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    fontWeight: 'bold',
  };

  const studentDetailsStyle = {
    flex: 1,
  };

  const studentNameStyle = {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: theme === 'dark' ? '#fff' : '#333',
    marginBottom: '0.25rem',
  };

  const studentEmailStyle = {
    fontSize: '0.9rem',
    color: theme === 'dark' ? '#aaa' : '#666',
  };

  const createdAtStyle = {
    fontSize: '0.85rem',
    color: theme === 'dark' ? '#888' : '#999',
    marginBottom: '1rem',
  };

  const buttonsContainerStyle = {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  };

  const buttonStyle = (action) => ({
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: processingId === pendingRequests.find(r => r.id)?.id ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    opacity: processingId === pendingRequests.find(r => r.id)?.id ? 0.6 : 1,
    backgroundColor: action === 'accepted' ? '#27ae60' : '#e74c3c',
    color: '#fff',
  });

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '3rem 2rem',
    backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
    borderRadius: '8px',
    color: theme === 'dark' ? '#aaa' : '#666',
  };

  const emptyStateIconStyle = {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.5,
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ 
            color: theme === 'dark' ? '#fff' : '#333',
            fontSize: '1.1rem' 
          }}>
            Loading pending confirmations...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>Pending Student Confirmations</div>
        <div style={subtitleStyle}>
          Review and approve student connection requests
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee',
          color: '#c33',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          border: '1px solid #fcc',
        }}>
          {error}
        </div>
      )}

      {pendingRequests.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyStateIconStyle}>✓</div>
          <p>No pending student confirmations at this time</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Students will appear here once they request to connect with you
          </p>
        </div>
      ) : (
        <div>
          {pendingRequests.map((request) => (
            <div key={request.id} style={requestCardStyle}>
              <div style={studentInfoStyle}>
                <div style={avatarStyle}>
                  {request.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div style={studentDetailsStyle}>
                  <div style={studentNameStyle}>
                    {request.student?.name || 'Unknown Student'}
                  </div>
                  <div style={studentEmailStyle}>
                    {request.student?.email || 'No email'}
                  </div>
                </div>
              </div>

              <div style={createdAtStyle}>
                Requested: {new Date(request.created_at).toLocaleDateString()}
              </div>

              <div style={buttonsContainerStyle}>
                <button
                  onClick={() => handleConfirmRequest(request.id, 'reject')}
                  disabled={processingId === request.id}
                  style={{
                    ...buttonStyle('reject'),
                    backgroundColor: '#e74c3c',
                  }}
                >
                  {processingId === request.id ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleConfirmRequest(request.id, 'accept')}
                  disabled={processingId === request.id}
                  style={{
                    ...buttonStyle('accept'),
                    backgroundColor: '#27ae60',
                  }}
                >
                  {processingId === request.id ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PendingConfirmations;
