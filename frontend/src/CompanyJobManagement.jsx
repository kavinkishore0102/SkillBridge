import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/companyJobManagement.css';

const CompanyJobManagement = () => {
  const [activeTab, setActiveTab] = useState('jobs'); // jobs or applications
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    shortlistedCount: 0,
    rejectedCount: 0,
    acceptedCount: 0,
    pendingCount: 0
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingJob, setEditingJob] = useState(null);
  const [editForm, setEditForm] = useState({});

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchCompanyJobs();
    } else {
      fetchApplicationStats();
    }
  }, [activeTab]);

  const fetchCompanyJobs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/company/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data.jobs || []);
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setErrorMessage('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/company/application-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching stats:', error);
      setErrorMessage('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobApplications = async (jobId) => {
    setLoading(true);
    try {
      const url = filterStatus 
        ? `http://localhost:8080/api/jobs/${jobId}/applications?status=${filterStatus}`
        : `http://localhost:8080/api/jobs/${jobId}/applications`;
      
      console.log('Fetching applications from:', url);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Applications response:', response.data);
      setApplications(response.data.applicants || []);
      setSelectedJob(jobId);
      setActiveTab('applications'); // Switch to applications tab
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching applications:', error);
      console.error('Error response:', error.response);
      setErrorMessage(error.response?.data?.error || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    try {
      await axios.patch(`http://localhost:8080/api/applications/${appId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage(`Application status updated to ${newStatus}`);
      
      // Refresh applications
      if (selectedJob) {
        fetchJobApplications(selectedJob);
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating application:', error);
      setErrorMessage('Failed to update application status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job listing?')) {
      try {
        await axios.delete(`http://localhost:8080/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Job listing deleted successfully');
        fetchCompanyJobs();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting job:', error);
        setErrorMessage('Failed to delete job listing');
      }
    }
  };

  const handleStartEditing = (job) => {
    setEditingJob(job.id);
    setEditForm({
      title: job.title,
      description: job.description,
      location: job.location,
      experience: typeof job.experience === 'number' ? job.experience : 0,
      stipend: job.stipend,
      is_active: job.is_active
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveEdit = async (jobId) => {
    try {
      const submitData = {
        ...editForm,
        stipend: editForm.stipend ? parseInt(editForm.stipend, 10) : 0,
        experience: typeof editForm.experience === 'number' ? editForm.experience : parseInt(editForm.experience, 10) || 0
      };
      
      await axios.put(`http://localhost:8080/api/jobs/${jobId}`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Job listing updated successfully');
      setEditingJob(null);
      fetchCompanyJobs();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating job:', error);
      setErrorMessage('Failed to update job listing');
    }
  };

  const getApplicationStats = () => {
    if (!selectedJob) return null;
    
    const jobApplications = applications.filter(app => 
      jobs.find(j => j.id === selectedJob)
    );
    
    return {
      total: applications.length,
      shortlisted: applications.filter(a => a.status === 'Shortlisted').length,
      rejected: applications.filter(a => a.status === 'Rejected').length,
      accepted: applications.filter(a => a.status === 'Accepted').length,
      pending: applications.filter(a => a.status === 'Applied').length
    };
  };

  return (
    <div className="company-job-management">
      <div className="management-header">
        <h1>Job Listings Management</h1>
        <a href="/post-job" className="btn-post-job">+ Post New Job</a>
      </div>

      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          📋 My Job Listings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📊 Applications & Stats
        </button>
      </div>

      {/* JOBS TAB */}
      {activeTab === 'jobs' && (
        <div className="jobs-section">
          {loading ? (
            <div className="loading">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <p>No job listings yet</p>
              <a href="/post-job" className="btn-primary">Post Your First Job</a>
            </div>
          ) : (
            <div className="jobs-grid">
              {jobs.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <h3>{job.title}</h3>
                    <span className={`status-badge ${job.is_active ? 'active' : 'inactive'}`}>
                      {job.is_active ? '✓ Active' : '⊗ Inactive'}
                    </span>
                  </div>

                  <div className="job-meta">
                    <span className="meta-item">📍 {job.location}</span>
                    <span className="meta-item">📋 {job.experience ?? 0} {job.experience === 1 ? 'year' : 'years'} exp</span>
                    {job.stipend > 0 && (
                      <span className="meta-item">
                        💰 {job.stipend.toLocaleString()}{' '}
                        {job.currency === 'Monthly' ? '/ month' : 'LPA'}
                      </span>
                    )}
                  </div>

                  <div className="job-description">
                    {job.description.substring(0, 150)}...
                  </div>

                  <div className="job-stats">
                    <span>Applications: <strong>{job.applicant_count || 0}</strong></span>
                  </div>

                  {editingJob === job.id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        name="title"
                        value={editForm.title}
                        onChange={handleEditFormChange}
                        className="form-control"
                        placeholder="Job title"
                      />
                      <textarea
                        name="description"
                        value={editForm.description}
                        onChange={handleEditFormChange}
                        className="form-control"
                        placeholder="Job description"
                        rows="4"
                      />
                      <input
                        type="text"
                        name="location"
                        value={editForm.location}
                        onChange={handleEditFormChange}
                        className="form-control"
                        placeholder="Location"
                      />
                      <label className="form-label-inline">Experience (years)</label>
                      <select
                        className="form-control"
                        value={editForm.experience ?? 0}
                        onChange={(e) => setEditForm(prev => ({ ...prev, experience: parseInt(e.target.value, 10) }))}
                      >
                        <option value={0}>0 years</option>
                        <option value={1}>1 year</option>
                        <option value={2}>2 years</option>
                      </select>
                      <input
                        type="number"
                        name="stipend"
                        value={editForm.stipend}
                        onChange={handleEditFormChange}
                        className="form-control"
                        placeholder="Stipend"
                      />
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={editForm.is_active}
                          onChange={handleEditFormChange}
                        />
                        Active
                      </label>
                      <div className="edit-actions">
                        <button 
                          className="btn-save"
                          onClick={() => handleSaveEdit(job.id)}
                        >
                          Save
                        </button>
                        <button 
                          className="btn-cancel"
                          onClick={() => setEditingJob(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="job-actions">
                      <button 
                        className="btn-view"
                        onClick={() => fetchJobApplications(job.id)}
                      >
                        View Applications
                      </button>
                      <button 
                        className="btn-edit"
                        onClick={() => handleStartEditing(job)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {activeTab === 'applications' && (
        <div className="applications-section">
          {loading ? (
            <div className="loading">Loading statistics...</div>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{stats.totalApplications}</div>
                  <div className="stat-label">Total Applications</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number pending">{stats.pendingCount}</div>
                  <div className="stat-label">Pending Review</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number shortlisted">{stats.shortlistedCount}</div>
                  <div className="stat-label">Shortlisted</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number accepted">{stats.acceptedCount}</div>
                  <div className="stat-label">Accepted</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number rejected">{stats.rejectedCount}</div>
                  <div className="stat-label">Rejected</div>
                </div>
              </div>

              {selectedJob && (
                <div className="job-applications">
                  <div className="job-apps-header">
                    <h3>Applications for: {jobs.find(j => j.id === selectedJob)?.title}</h3>
                    <select 
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        fetchJobApplications(selectedJob);
                      }}
                      className="status-filter"
                    >
                      <option value="">All Status</option>
                      <option value="Applied">Applied</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {loading ? (
                    <div className="loading">Loading applications...</div>
                  ) : applications.length === 0 ? (
                    <div className="empty-state">
                      <p>No applications found</p>
                    </div>
                  ) : (
                    <div className="applications-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Applicant Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Applied On</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map(app => (
                            <tr key={app.id}>
                              <td className="applicant-name">{app.user.name}</td>
                              <td>{app.user.email}</td>
                              <td>
                                <span className={`status-tag status-${app.status.toLowerCase()}`}>
                                  {app.status}
                                </span>
                              </td>
                              <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                              <td>
                                <button 
                                  className="btn-view-detail"
                                  onClick={() => setSelectedApplication(app)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {!selectedJob && (
                <div className="select-job-prompt">
                  <p>Select a job from your listings to view applications</p>
                  <div className="jobs-list-compact">
                    {jobs.map(job => (
                      <button 
                        key={job.id}
                        className="job-select-btn"
                        onClick={() => fetchJobApplications(job.id)}
                      >
                        {job.title} <span className="count">({job.applicant_count || 0})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* APPLICATION DETAIL MODAL */}
      {selectedApplication && (
        <div className="modal-overlay" onClick={() => setSelectedApplication(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedApplication(null)}>×</button>
            
            <div className="applicant-detail">
              <h2>{selectedApplication.user.name}</h2>
              <p className="email">{selectedApplication.user.email}</p>
              
              <div className="detail-section">
                <h3>Application Status</h3>
                <div className="status-section">
                  <span className={`status-tag status-${selectedApplication.status.toLowerCase()}`}>
                    {selectedApplication.status}
                  </span>
                  <div className="status-actions">
                    <button 
                      className="btn-shortlist"
                      onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'Shortlisted')}
                      disabled={selectedApplication.status === 'Shortlisted'}
                    >
                      ✓ Shortlist
                    </button>
                    <button 
                      className="btn-accept"
                      onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'Accepted')}
                      disabled={selectedApplication.status === 'Accepted'}
                    >
                      ✓ Accept
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'Rejected')}
                      disabled={selectedApplication.status === 'Rejected'}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>

              {selectedApplication.cover_letter && (
                <div className="detail-section">
                  <h3>Cover Letter</h3>
                  <p className="cover-letter">{selectedApplication.cover_letter}</p>
                </div>
              )}

              {selectedApplication.resume && (
                <div className="detail-section">
                  <h3>Resume</h3>
                  <a href={selectedApplication.resume} target="_blank" rel="noopener noreferrer" className="btn-view-resume">
                    📄 View Resume
                  </a>
                </div>
              )}

              <div className="detail-section">
                <h3>Applied On</h3>
                <p>{new Date(selectedApplication.applied_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyJobManagement;
