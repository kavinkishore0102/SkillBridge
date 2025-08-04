import { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

function GitHubIntegration({ onUpdate }) {
  const [githubToken, setGithubToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [githubUser, setGithubUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSetToken = async (e) => {
    e.preventDefault();
    if (!githubToken.trim()) {
      setError('Please enter a GitHub token');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:8080/api/github/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          github_token: githubToken
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`GitHub token saved! Connected as: ${data.github_user}`);
        setHasToken(true);
        setGithubUser(data.github_user);
        setGithubToken('');
        if (onUpdate) onUpdate();
      } else {
        setError(data.error || 'Failed to save GitHub token');
      }
    } catch (error) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveToken = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:8080/api/github/token', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('GitHub token removed successfully');
        setHasToken(false);
        setGithubUser('');
        if (onUpdate) onUpdate();
      } else {
        setError(data.error || 'Failed to remove GitHub token');
      }
    } catch (error) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '20px'
    }}>
      <h3 style={{
        margin: '0 0 15px 0',
        color: '#1a202c',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '20px' }}>🐙</span>
        GitHub Integration
      </h3>
      
      <p style={{
        color: '#4a5568',
        marginBottom: '15px',
        fontSize: '14px'
      }}>
        Connect your GitHub account to automatically create repositories when you apply to projects.
        Companies will be added as collaborators for easy project tracking.
      </p>

      {error && (
        <div style={{
          backgroundColor: '#fed7d7',
          color: '#9b2c2c',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#c6f6d5',
          color: '#22543d',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          {success}
        </div>
      )}

      {!hasToken ? (
        <form onSubmit={handleSetToken}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#2d3748'
            }}>
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e0',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <small style={{
              color: '#718096',
              fontSize: '12px',
              marginTop: '5px',
              display: 'block'
            }}>
              Create a token at{' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#3182ce' }}
              >
                GitHub Settings
              </a>
              {' '}with 'repo' permissions.
            </small>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? '#cbd5e0' : '#10b981',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {loading ? 'Connecting...' : 'Connect GitHub'}
          </button>
        </form>
      ) : (
        <div>
          <div style={{
            backgroundColor: '#c6f6d5',
            color: '#22543d',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>✅</span>
            <span>Connected as: <strong>{githubUser}</strong></span>
          </div>
          <button
            onClick={handleRemoveToken}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#cbd5e0' : '#e53e3e',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {loading ? 'Removing...' : 'Disconnect GitHub'}
          </button>
        </div>
      )}
    </div>
  );
}

export default GitHubIntegration;
