import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from './contexts/ThemeContext';
import { utils } from './utils/api';

const API_BASE = 'http://localhost:8080/api';

// Parse skills or requirements from API (can be JSON string or array)
function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const user = utils.getUser();
    if (!user) {
      navigate('/');
      return;
    }
    if (user.role !== 'student') {
      navigate('/dashboard');
      return;
    }
    loadJobs();
    loadMyApplications();
  }, [navigate]);

  const loadJobs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/jobs`);
      setJobs(res.data.jobs || []);
      setError('');
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadMyApplications = async () => {
    const token = utils.getToken();
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/my-job-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppliedJobIds(new Set(res.data.job_ids || []));
    } catch {
      // ignore
    }
  };

  const handleApply = async (jobId) => {
    const token = utils.getToken();
    if (!token) {
      navigate('/');
      return;
    }
    setApplyingId(jobId);
    setError('');
    try {
      await axios.post(`${API_BASE}/jobs/${jobId}/apply`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setAppliedJobIds(prev => new Set([...prev, jobId]));
      setSuccessMessage('Application submitted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to apply';
      setError(msg);
    } finally {
      setApplyingId(null);
    }
  };

  const user = utils.getUser();
  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      padding: '24px',
      color: theme.colors.text
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '8px', fontSize: '28px' }}>Job Listings</h1>
        <p style={{ color: theme.colors.textSecondary, marginBottom: '24px' }}>
          Browse and apply to job opportunities from companies.
        </p>

        {successMessage && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {successMessage}
          </div>
        )}
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: theme.colors.textSecondary }}>Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary }}>No job listings at the moment.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {jobs.map((job) => {
              const applied = appliedJobIds.has(job.id);
              const deadlinePassed = job.application_deadline && new Date(job.application_deadline) < new Date();
              const canApply = !applied && !deadlinePassed;
              return (
                <div
                  key={job.id}
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: theme.shadows?.card || '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{job.title}</h3>
                      {job.company?.name && (
                        <p style={{ margin: '0 0 4px 0', color: theme.colors.textSecondary, fontSize: '14px' }}>
                          {job.company.name}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px', fontSize: '13px', color: theme.colors.textSecondary }}>
                        <span>📍 {job.location}</span>
                        <span>📋 {job.experience ?? 0} yrs exp</span>
                        {job.stipend > 0 && (
                          <span>
                            💰 {job.stipend?.toLocaleString?.()}{' '}
                            {job.currency === 'Monthly' ? '/ month' : 'LPA'}
                          </span>
                        )}
                        <span>📅 Deadline: {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : '—'}</span>
                      </div>
                      {job.description && (
                        <p style={{ marginTop: '12px', fontSize: '14px', lineHeight: 1.5 }}>
                          {job.description.length > 200 ? job.description.substring(0, 200) + '...' : job.description}
                        </p>
                      )}
                      {parseList(job.skills).length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <strong style={{ fontSize: '13px', color: theme.colors.text }}>Required skills: </strong>
                          <span style={{ fontSize: '13px', color: theme.colors.textSecondary }}>
                            {parseList(job.skills).join(', ')}
                          </span>
                        </div>
                      )}
                      {parseList(job.requirements).length > 0 && (
                        <div style={{ marginTop: '6px' }}>
                          <strong style={{ fontSize: '13px', color: theme.colors.text }}>Requirements: </strong>
                          <span style={{ fontSize: '13px', color: theme.colors.textSecondary }}>
                            {parseList(job.requirements).join(' • ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {applied ? (
                        <span style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          backgroundColor: theme.colors.success || '#28a745',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          Applied
                        </span>
                      ) : deadlinePassed ? (
                        <span style={{ padding: '8px 16px', color: theme.colors.textSecondary, fontSize: '14px' }}>
                          Deadline passed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApply(job.id)}
                          disabled={applyingId === job.id}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: theme.colors.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: applyingId === job.id ? 'wait' : 'pointer'
                          }}
                        >
                          {applyingId === job.id ? 'Applying...' : 'Apply'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Jobs;
