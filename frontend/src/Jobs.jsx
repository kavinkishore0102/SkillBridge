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
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState('');
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

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setCoverLetter('');
    setResume('');
    setError('');
    setSuccessMessage('');
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    const token = utils.getToken();
    if (!token) {
      navigate('/');
      return;
    }
    setApplyingId(selectedJob.id);
    setError('');
    try {
      await axios.post(`${API_BASE}/jobs/${selectedJob.id}/apply`, {
        cover_letter: coverLetter,
        resume: resume
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setAppliedJobIds(prev => new Set([...prev, selectedJob.id]));
      setSuccessMessage('Application submitted successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        setSelectedJob(null);
      }, 2000);
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
                          onClick={() => handleApplyClick(job)}
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

      {selectedJob && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: theme.colors.surface,
            padding: '24px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: theme.shadows?.modal || '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Apply: {selectedJob.title}</h2>
              <button onClick={() => setSelectedJob(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: theme.colors.textSecondary }}>×</button>
            </div>
            
            <p style={{ color: theme.colors.textSecondary, marginBottom: '20px' }}>
              Review the details below and fill out any necessary information before submitting.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Cover Letter (Optional)</label>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.colors.border}`, minHeight: '100px' }}
                placeholder="Why are you a great fit for this role?"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Resume Link (Optional)</label>
              <input
                type="text"
                value={resume}
                onChange={e => setResume(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.colors.border}` }}
                placeholder="https://link-to-your-resume.com"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedJob(null)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: `1px solid ${theme.colors.border}`, background: 'transparent', cursor: 'pointer', color: theme.colors.text }}
              >
                Cancel
              </button>
              <button 
                onClick={handleApply}
                disabled={applyingId === selectedJob.id}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: theme.colors.primary, color: 'white', cursor: applyingId === selectedJob.id ? 'wait' : 'pointer', fontWeight: '600' }}
              >
                {applyingId === selectedJob.id ? 'Submitting...' : 'Confirm Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Jobs;
