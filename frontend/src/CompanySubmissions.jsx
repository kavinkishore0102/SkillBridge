import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';
import { utils } from './utils/api';

const API_BASE = 'http://localhost:8080/api';

const CompanySubmissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviewModal, setReviewModal] = useState(null); // { submission }
    const [reviewForm, setReviewForm] = useState({ status: 'approved', feedback: '' });
    const [reviewLoading, setReviewLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    const navigate = useNavigate();
    const theme = useTheme();
    const { addNotification } = useNotifications();

    useEffect(() => {
        const token = utils.getToken();
        if (!token) { navigate('/'); return; }
        fetchAllSubmissions();
    }, [navigate]);

    const fetchAllSubmissions = async () => {
        try {
            const token = utils.getToken();

            // 1. Fetch all company projects
            const projectsRes = await fetch(`${API_BASE}/company/projects`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const projectsData = await projectsRes.json();
            if (!projectsRes.ok) throw new Error(projectsData.error || 'Failed to load projects');

            const projects = projectsData.projects || [];
            if (projects.length === 0) { setSubmissions([]); setLoading(false); return; }

            // 2. Fetch submissions for each project in parallel
            const results = await Promise.allSettled(
                projects.map((p) =>
                    fetch(`${API_BASE}/projects/${p.id}/submissions`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }).then((r) => r.json())
                )
            );

            // 3. Flatten and enrich with project info
            const all = [];
            results.forEach((result, idx) => {
                if (result.status === 'fulfilled') {
                    const subs = result.value.submissions || [];
                    subs.forEach((s) => all.push({ ...s, project: projects[idx] }));
                }
            });

            // Sort newest first
            all.sort((a, b) => new Date(b.CreatedAt || b.created_at) - new Date(a.CreatedAt || a.created_at));
            setSubmissions(all);
        } catch (err) {
            console.error('Error fetching submissions:', err);
            setError(err.message || 'Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmit = async () => {
        if (!reviewModal) return;
        setReviewLoading(true);
        try {
            const token = utils.getToken();
            const res = await fetch(`${API_BASE}/submissions/${reviewModal.ID || reviewModal.id}/review`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: reviewForm.status,
                    feedback: reviewForm.feedback,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Review failed');

            // Update local state
            setSubmissions((prev) =>
                prev.map((s) =>
                    (s.ID || s.id) === (reviewModal.ID || reviewModal.id)
                        ? { ...s, status: reviewForm.status, feedback: reviewForm.feedback }
                        : s
                )
            );
            addNotification(`Submission ${reviewForm.status} successfully!`, 'Just now');
            setReviewModal(null);
            setReviewForm({ status: 'approved', feedback: '' });
        } catch (err) {
            console.error('Review error:', err);
            setError(err.message);
        } finally {
            setReviewLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': case 'accepted': return theme.colors.success;
            case 'rejected': return theme.colors.danger;
            case 'pending': case 'submitted': return theme.colors.warning;
            case 'reviewed': return theme.colors.info;
            default: return theme.colors.textSecondary;
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': case 'accepted': return '✅';
            case 'rejected': return '❌';
            case 'pending': case 'submitted': return '⏳';
            case 'reviewed': return '👁️';
            default: return '📄';
        }
    };

    const filtered = filterStatus === 'all'
        ? submissions
        : submissions.filter((s) => (s.status || 'submitted').toLowerCase() === filterStatus);

    // ── Loading ──────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{
                backgroundColor: theme.colors.background, minHeight: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{ textAlign: 'center', color: theme.colors.text }}>
                    <div style={{
                        width: '50px', height: '50px',
                        border: `3px solid ${theme.colors.primary}20`,
                        borderTop: `3px solid ${theme.colors.primary}`,
                        borderRadius: '50%', animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px',
                    }} />
                    <p style={{ fontSize: '18px' }}>Loading submissions…</p>
                </div>
            </div>
        );
    }

    // ── Main UI ──────────────────────────────────────────────────────────────────
    return (
        <div style={{ backgroundColor: theme.colors.background, minHeight: '100vh', padding: '20px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ color: theme.colors.text, fontSize: '32px', fontWeight: 'bold', margin: '0 0 6px' }}>
                            📦 Project Submissions
                        </h1>
                        <p style={{ color: theme.colors.textSecondary, margin: 0, fontSize: '15px' }}>
                            Review and grade student submissions across all your projects
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Filter pills */}
                        {['all', 'submitted', 'approved', 'rejected'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilterStatus(f)}
                                style={{
                                    padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                                    cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                                    backgroundColor: filterStatus === f ? theme.colors.primary : theme.colors.surface,
                                    color: filterStatus === f ? 'white' : theme.colors.textSecondary,
                                    boxShadow: filterStatus === f ? `0 2px 8px ${theme.colors.primary}40` : 'none',
                                }}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div style={{
                        backgroundColor: theme.colors.danger + '20', color: theme.colors.danger,
                        padding: '15px', borderRadius: '8px', marginBottom: '20px',
                        border: `1px solid ${theme.colors.danger}40`,
                    }}>
                        {error}
                    </div>
                )}

                {/* Stats row */}
                {submissions.length > 0 && (
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Total', count: submissions.length, color: theme.colors.primary },
                            { label: 'Pending', count: submissions.filter(s => ['submitted', 'pending'].includes((s.status || 'submitted').toLowerCase())).length, color: theme.colors.warning },
                            { label: 'Approved', count: submissions.filter(s => ['approved', 'accepted'].includes((s.status || '').toLowerCase())).length, color: theme.colors.success },
                            { label: 'Rejected', count: submissions.filter(s => (s.status || '').toLowerCase() === 'rejected').length, color: theme.colors.danger },
                        ].map(({ label, count, color }) => (
                            <div key={label} style={{
                                backgroundColor: theme.colors.surface, borderRadius: '10px',
                                padding: '14px 24px', border: `1px solid ${theme.colors.border}`,
                                textAlign: 'center', minWidth: '100px',
                            }}>
                                <div style={{ fontSize: '26px', fontWeight: '700', color }}>{count}</div>
                                <div style={{ fontSize: '13px', color: theme.colors.textSecondary, marginTop: '2px' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {filtered.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '70px 20px',
                        backgroundColor: theme.colors.surface, borderRadius: '12px',
                        border: `1px solid ${theme.colors.border}`,
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
                        <h3 style={{ color: theme.colors.text, fontSize: '24px', marginBottom: '10px' }}>
                            {filterStatus === 'all' ? 'No Submissions Yet' : `No "${filterStatus}" Submissions`}
                        </h3>
                        <p style={{ color: theme.colors.textSecondary, fontSize: '16px', lineHeight: '1.5' }}>
                            {filterStatus === 'all'
                                ? 'Once students submit their work for your projects, they will appear here.'
                                : `No submissions with status "${filterStatus}" at the moment.`}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {filtered.map((submission) => {
                            const sid = submission.ID || submission.id;
                            const studentName = submission.Student?.name || submission.Student?.Name || 'Unknown Student';
                            const studentEmail = submission.Student?.email || submission.Student?.Email || '';
                            const projectTitle = submission.project?.title || submission.Project?.title || 'Unknown Project';
                            const submittedDate = submission.SubmittedAt || submission.submitted_at || submission.CreatedAt || submission.created_at;
                            const githubUrl = submission.GithubURL || submission.github_url || submission.GithubLink || submission.github_link;
                            const demoUrl = submission.DemoURL || submission.demo_url;
                            const description = submission.Description || submission.description || submission.Notes || submission.notes;
                            const status = submission.status || submission.Status || 'submitted';

                            return (
                                <div
                                    key={sid}
                                    style={{
                                        backgroundColor: theme.colors.surface,
                                        borderRadius: '12px',
                                        padding: '24px',
                                        border: `1px solid ${theme.colors.border}`,
                                        boxShadow: theme.shadows?.card,
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = theme.shadows?.card || ''; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                                        {/* Left: project + student */}
                                        <div>
                                            <h3 style={{ color: theme.colors.text, fontSize: '19px', fontWeight: '700', margin: '0 0 4px' }}>
                                                {projectTitle}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '20px' }}>👤</span>
                                                <span style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
                                                    <strong style={{ color: theme.colors.text }}>{studentName}</strong>
                                                    {studentEmail && <span> · {studentEmail}</span>}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right: status badge */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            backgroundColor: getStatusColor(status) + '20',
                                            color: getStatusColor(status),
                                            padding: '6px 14px', borderRadius: '20px',
                                            fontSize: '13px', fontWeight: '600',
                                            border: `1px solid ${getStatusColor(status)}40`,
                                            flexShrink: 0,
                                        }}>
                                            {getStatusIcon(status)}
                                            <span style={{ textTransform: 'capitalize' }}>{status}</span>
                                        </div>
                                    </div>

                                    {/* Description / Notes */}
                                    {description && (
                                        <div style={{
                                            backgroundColor: theme.colors.background, borderRadius: '8px',
                                            padding: '12px 16px', marginBottom: '14px',
                                            border: `1px solid ${theme.colors.border}`,
                                        }}>
                                            <p style={{
                                                color: theme.colors.textSecondary, fontSize: '13px',
                                                lineHeight: '1.6', margin: 0,
                                                display: '-webkit-box', WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                            }}>
                                                {description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Links row */}
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                        {githubUrl && (
                                            <a href={githubUrl} target="_blank" rel="noreferrer" style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                color: theme.colors.primary, fontSize: '13px', fontWeight: '500',
                                                textDecoration: 'none', padding: '6px 12px',
                                                backgroundColor: theme.colors.primary + '10', borderRadius: '6px',
                                                border: `1px solid ${theme.colors.primary}30`,
                                                transition: 'background 0.2s',
                                            }}>
                                                🔗 GitHub Repository
                                            </a>
                                        )}
                                        {demoUrl && (
                                            <a href={demoUrl} target="_blank" rel="noreferrer" style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                color: theme.colors.secondary || theme.colors.info, fontSize: '13px', fontWeight: '500',
                                                textDecoration: 'none', padding: '6px 12px',
                                                backgroundColor: (theme.colors.secondary || theme.colors.info) + '10', borderRadius: '6px',
                                                border: `1px solid ${(theme.colors.secondary || theme.colors.info)}30`,
                                            }}>
                                                🌐 Live Demo
                                            </a>
                                        )}
                                    </div>

                                    {/* Existing feedback */}
                                    {submission.feedback && (
                                        <div style={{
                                            backgroundColor: theme.colors.info + '10', border: `1px solid ${theme.colors.info}30`,
                                            borderRadius: '8px', padding: '12px', marginBottom: '14px',
                                        }}>
                                            <p style={{ color: theme.colors.info, fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>💬 Your Feedback</p>
                                            <p style={{ color: theme.colors.text, fontSize: '13px', lineHeight: '1.4', margin: 0 }}>{submission.feedback}</p>
                                        </div>
                                    )}

                                    {/* Footer: date + actions */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                        <span style={{ fontSize: '13px', color: theme.colors.textSecondary }}>
                                            📅 Submitted: {submittedDate ? new Date(submittedDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                        <button
                                            onClick={() => { setReviewModal(submission); setReviewForm({ status: 'approved', feedback: '' }); }}
                                            style={{
                                                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary || theme.colors.info})`,
                                                color: 'white', border: 'none',
                                                padding: '9px 20px', borderRadius: '8px',
                                                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                                                transition: 'transform 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.04)'}
                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                        >
                                            ✏️ Review Submission
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {reviewModal && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
                }}
                    onClick={(e) => { if (e.target === e.currentTarget) setReviewModal(null); }}
                >
                    <div style={{
                        backgroundColor: theme.colors.surface, borderRadius: '16px',
                        padding: '32px', width: '100%', maxWidth: '500px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        border: `1px solid ${theme.colors.border}`,
                    }}>
                        <h2 style={{ color: theme.colors.text, fontSize: '22px', fontWeight: '700', marginTop: 0, marginBottom: '6px' }}>
                            Review Submission
                        </h2>
                        <p style={{ color: theme.colors.textSecondary, fontSize: '14px', marginBottom: '24px' }}>
                            {reviewModal.project?.title} · {reviewModal.Student?.name || reviewModal.Student?.Name || 'Student'}
                        </p>

                        {/* Status select */}
                        <label style={{ display: 'block', color: theme.colors.text, fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                            Decision
                        </label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            {['approved', 'rejected'].map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setReviewForm((f) => ({ ...f, status: opt }))}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', fontSize: '14px',
                                        fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                                        border: `2px solid ${reviewForm.status === opt ? (opt === 'approved' ? theme.colors.success : theme.colors.danger) : theme.colors.border}`,
                                        backgroundColor: reviewForm.status === opt ? (opt === 'approved' ? theme.colors.success + '20' : theme.colors.danger + '20') : 'transparent',
                                        color: reviewForm.status === opt ? (opt === 'approved' ? theme.colors.success : theme.colors.danger) : theme.colors.textSecondary,
                                    }}
                                >
                                    {opt === 'approved' ? '✅ Approve' : '❌ Reject'}
                                </button>
                            ))}
                        </div>

                        {/* Feedback textarea */}
                        <label style={{ display: 'block', color: theme.colors.text, fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                            Feedback <span style={{ color: theme.colors.textSecondary, fontWeight: '400' }}>(optional)</span>
                        </label>
                        <textarea
                            value={reviewForm.feedback}
                            onChange={(e) => setReviewForm((f) => ({ ...f, feedback: e.target.value }))}
                            placeholder="Provide feedback to the student…"
                            rows={4}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', fontSize: '14px',
                                border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.background,
                                color: theme.colors.text, resize: 'vertical', outline: 'none',
                                fontFamily: 'inherit', boxSizing: 'border-box',
                            }}
                        />

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button
                                onClick={() => setReviewModal(null)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '8px', fontSize: '15px',
                                    fontWeight: '600', cursor: 'pointer',
                                    border: `1px solid ${theme.colors.border}`, backgroundColor: 'transparent',
                                    color: theme.colors.textSecondary,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReviewSubmit}
                                disabled={reviewLoading}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '8px', fontSize: '15px',
                                    fontWeight: '600', cursor: reviewLoading ? 'not-allowed' : 'pointer',
                                    border: 'none',
                                    background: reviewLoading ? theme.colors.border : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary || theme.colors.info})`,
                                    color: 'white', transition: 'opacity 0.2s',
                                    opacity: reviewLoading ? 0.7 : 1,
                                }}
                            >
                                {reviewLoading ? 'Submitting…' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default CompanySubmissions;
