import React, { useState } from 'react';
import axios from 'axios';
import './css/postJob.css';
import { utils } from './utils/api';

const PostJob = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Internship', // Internship, Full-time, Part-time
    domain: '',
    location: '',
    stipend: '',
    currency: 'INR',
    duration: '',
    requirements: [],
    skills: [],
    application_deadline: '',
  });

  const [requirementInput, setRequirementInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const domains = [
    'Engineering',
    'Design',
    'Marketing',
    'Sales',
    'Data Science',
    'Product Management',
    'Operations',
    'Human Resources',
    'Finance',
    'Content Writing',
  ];

  const categories = ['Internship', 'Full-time', 'Part-time'];
  const durations = ['1 month', '2 months', '3 months', '6 months', '1 year'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddRequirement = (e) => {
    e.preventDefault();
    if (requirementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }));
      setRequirementInput('');
    }
  };

  const handleRemoveRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Job title is required';
    if (!formData.description.trim()) return 'Job description is required';
    if (!formData.domain) return 'Domain is required';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.duration) return 'Duration is required';
    if (!formData.application_deadline) return 'Application deadline is required';
    if (new Date(formData.application_deadline) < new Date()) {
      return 'Application deadline must be in the future';
    }
    if (formData.skills.length === 0) return 'Add at least one skill requirement';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = utils.getToken();
      console.log('Token from localStorage:', token ? 'Present' : 'Missing');
      
      if (!token) {
        setErrorMessage('You must be logged in to post a job');
        return;
      }
      
      // Decode and log token claims for debugging
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Token claims:', payload);
          console.log('User role:', payload.role);
          console.log('User ID:', payload.user_id);
        }
      } catch (e) {
        console.log('Could not decode token:', e.message);
      }
      
      // Convert stipend to number
      const submitData = {
        ...formData,
        stipend: formData.stipend ? parseInt(formData.stipend, 10) : 0
      };
      
      console.log('Submitting job data:', submitData);
      
      const response = await axios.post('http://localhost:8080/api/jobs', submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.status === 201) {
        setSuccessMessage('Job listing posted successfully!');
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: 'Internship',
          domain: '',
          location: '',
          stipend: '',
          currency: 'INR',
          duration: '',
          requirements: [],
          skills: [],
          application_deadline: '',
        });
        
        // Redirect to job management page after 2 seconds
        setTimeout(() => {
          window.location.href = '/company/jobs';
        }, 2000);
      }
    } catch (error) {
      console.error('Error posting job:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to post job listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-job-container">
      <div className="post-job-wrapper">
        <h1>Post a Job Opportunity</h1>
        <p className="subtitle">Find talented interns and employees for your organization</p>

        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="alert alert-error">{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="post-job-form">
          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="title">Job Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., React Developer Intern"
                className="form-control"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Job Type *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="domain">Domain *</label>
                <select
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Select a domain</option>
                  {domains.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Job Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the role, responsibilities, and what you're looking for in a candidate..."
                rows="6"
                className="form-control"
              />
            </div>
          </div>

          {/* Location & Duration */}
          <div className="form-section">
            <h2>Location & Duration</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Remote, Bangalore, New York"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duration *</label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Select duration</option>
                  {durations.map(dur => (
                    <option key={dur} value={dur}>{dur}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="stipend">Stipend/Salary</label>
                <div className="input-group">
                  <input
                    type="number"
                    id="stipend"
                    name="stipend"
                    value={formData.stipend}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    className="form-control"
                    min="0"
                  />
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="application_deadline">Application Deadline *</label>
                <input
                  type="date"
                  id="application_deadline"
                  name="application_deadline"
                  value={formData.application_deadline}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="form-section">
            <h2>Requirements</h2>
            <div className="form-group">
              <label>Add Requirements</label>
              <div className="input-group">
                <input
                  type="text"
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  placeholder="e.g., Bachelor's degree in Computer Science"
                  className="form-control"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddRequirement(e);
                    }
                  }}
                />
                <button type="button" onClick={handleAddRequirement} className="btn-add">
                  Add
                </button>
              </div>
              <div className="tags-container">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="tag">
                    {req}
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(index)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skills Required */}
          <div className="form-section">
            <h2>Required Skills *</h2>
            <div className="form-group">
              <label>Add Skills</label>
              <div className="input-group">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="e.g., React, JavaScript, CSS"
                  className="form-control"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSkill(e);
                    }
                  }}
                />
                <button type="button" onClick={handleAddSkill} className="btn-add">
                  Add
                </button>
              </div>
              <div className="tags-container">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="tag skill-tag">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? 'Posting...' : 'Post Job Opportunity'}
            </button>
            <a href="/company-jobs" className="btn-cancel">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
