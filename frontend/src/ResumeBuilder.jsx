import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { utils, resumeAPI } from './utils/api';

const blankExp = () => ({ company: '', position: '', location: '', startDate: '', endDate: 'Present', summary: '', highlights: [''] });
const blankEdu = () => ({ institution: '', degree: '', field: '', startDate: '', endDate: '' });
const blankProject = () => ({ name: '', description: '', technologies: '', highlights: [''] });

function ResumeBuilder() {
    const navigate = useNavigate();
    const theme = useTheme();
    const user = utils.getUser();

    const [location, setLocation] = useState('');
    const [experience, setExperience] = useState([blankExp()]);
    const [education, setEducation] = useState([blankEdu()]);
    const [projects, setProjects] = useState([blankProject()]);
    const [certifications, setCertifications] = useState([{ name: '' }]);

    const [loading, setLoading] = useState(false);
    const [resumeUrl, setResumeUrl] = useState(null);
    const [error, setError] = useState('');

    if (!user) { navigate('/'); return null; }

    // ——— Experience handlers ———
    const updateExp = (i, field, val) => { const c = [...experience]; c[i] = { ...c[i], [field]: val }; setExperience(c); };
    const updateHighlight = (ei, hi, val) => { const c = [...experience]; c[ei].highlights[hi] = val; setExperience(c); };
    const addHighlight = (ei) => { const c = [...experience]; c[ei].highlights.push(''); setExperience(c); };
    const removeHighlight = (ei, hi) => { const c = [...experience]; c[ei].highlights = c[ei].highlights.filter((_, idx) => idx !== hi); setExperience(c); };

    // ——— Education handlers ———
    const updateEdu = (i, field, val) => { const c = [...education]; c[i] = { ...c[i], [field]: val }; setEducation(c); };

    // ——— Project handlers ———
    const updateProject = (i, field, val) => { const c = [...projects]; c[i] = { ...c[i], [field]: val }; setProjects(c); };
    const updateProjectHighlight = (pi, hi, val) => { const c = [...projects]; c[pi].highlights[hi] = val; setProjects(c); };
    const addProjectHighlight = (pi) => { const c = [...projects]; c[pi].highlights.push(''); setProjects(c); };
    const removeProjectHighlight = (pi, hi) => { const c = [...projects]; c[pi].highlights = c[pi].highlights.filter((_, idx) => idx !== hi); setProjects(c); };

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setResumeUrl(null);
        try {
            const token = utils.getToken();
            const payload = {
                location,
                experience: experience.filter(e => e.company),
                education: education.filter(e => e.institution),
                projects: projects.filter(p => p.name).map(p => ({
                    name: p.name,
                    description: p.description,
                    technologies: p.technologies ? p.technologies.split(',').map(t => t.trim()).filter(Boolean) : [],
                    highlights: p.highlights.filter(Boolean),
                })),
                certifications: certifications.filter(c => c.name),
            };

            const data = await resumeAPI.generateResume(token, payload);
            const url = data?.data?.file_url || data?.data?.url || data?.url || data?.resumeUrl || null;
            if (url) {
                setResumeUrl(url);
            } else {
                // Show full response for debugging
                setError('Resume generated but no download link found. Raw: ' + JSON.stringify(data));
            }
        } catch (err) {
            setError('Failed to generate resume: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    // ——— Shared styles ———
    const card = { backgroundColor: theme.colors.surface, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: theme.shadows?.card || '0 2px 12px rgba(0,0,0,0.08)', border: `1px solid ${theme.colors.border}` };
    const input = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.background, color: theme.colors.text, fontSize: '14px', boxSizing: 'border-box' };
    const label = { display: 'block', fontSize: '13px', fontWeight: '600', color: theme.colors.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' };
    const sectionTitle = { fontSize: '18px', fontWeight: '700', color: theme.colors.text, marginBottom: '20px', paddingBottom: '10px', borderBottom: `2px solid ${theme.colors.primary}` };
    const addBtn = { background: 'transparent', border: `2px dashed ${theme.colors.border}`, color: theme.colors.primary, padding: '10px', borderRadius: '8px', width: '100%', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: '12px' };
    const removeBtn = { background: '#ff4757', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' };
    const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
    const entryBox = { marginBottom: '20px', padding: '16px', background: theme.colors.background, borderRadius: '10px', border: `1px solid ${theme.colors.border}` };

    return (
        <div style={{ backgroundColor: theme.colors.background, minHeight: '100vh', padding: '30px 20px' }}>
            <div style={{ maxWidth: '860px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', color: theme.colors.text, margin: 0 }}>📄 Resume Builder</h1>
                        <p style={{ color: theme.colors.textSecondary, margin: '6px 0 0' }}>Your profile is auto-filled. Add experience, projects &amp; education to generate your resume.</p>
                    </div>
                    <button onClick={() => navigate('/profile')} style={{ background: 'transparent', border: `1px solid ${theme.colors.border}`, color: theme.colors.text, padding: '10px 18px', borderRadius: '8px', cursor: 'pointer' }}>
                        ← Back
                    </button>
                </div>

                {/* Auto-filled banner */}
                <div style={{ ...card, background: `${theme.colors.primary}15`, border: `1px solid ${theme.colors.primary}40` }}>
                    <p style={{ margin: 0, color: theme.colors.text, fontSize: '14px' }}>
                        ✅ <strong>Auto-filled:</strong> {user.name} · {user.email}{user.phone ? ` · ${user.phone}` : ''}{user.skills ? ` · ${user.skills}` : ''}
                    </p>
                </div>

                {/* Location */}
                <div style={card}>
                    <div style={sectionTitle}>📍 Location</div>
                    <div>
                        <label style={label}>City, State / Country</label>
                        <input style={input} placeholder="e.g. Chennai, India" value={location} onChange={e => setLocation(e.target.value)} />
                    </div>
                </div>

                {/* Experience */}
                <div style={card}>
                    <div style={sectionTitle}>💼 Work Experience</div>
                    {experience.map((exp, i) => (
                        <div key={i} style={entryBox}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <strong style={{ color: theme.colors.text }}>Position {i + 1}</strong>
                                {experience.length > 1 && <button style={removeBtn} onClick={() => setExperience(experience.filter((_, idx) => idx !== i))}>Remove</button>}
                            </div>
                            <div style={{ ...grid2, marginBottom: '12px' }}>
                                <div><label style={label}>Company *</label><input style={input} placeholder="TechCorp Inc." value={exp.company} onChange={e => updateExp(i, 'company', e.target.value)} /></div>
                                <div><label style={label}>Job Title *</label><input style={input} placeholder="Software Engineer" value={exp.position} onChange={e => updateExp(i, 'position', e.target.value)} /></div>
                            </div>
                            <div style={{ ...grid2, marginBottom: '12px' }}>
                                <div><label style={label}>Location</label><input style={input} placeholder="Chennai, India" value={exp.location} onChange={e => updateExp(i, 'location', e.target.value)} /></div>
                                <div style={grid2}>
                                    <div><label style={label}>Start (YYYY-MM)</label><input style={input} placeholder="2022-01" value={exp.startDate} onChange={e => updateExp(i, 'startDate', e.target.value)} /></div>
                                    <div><label style={label}>End</label><input style={input} placeholder="Present" value={exp.endDate} onChange={e => updateExp(i, 'endDate', e.target.value)} /></div>
                                </div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={label}>Summary</label>
                                <textarea style={{ ...input, minHeight: '60px', resize: 'vertical' }} placeholder="Brief overview..." value={exp.summary} onChange={e => updateExp(i, 'summary', e.target.value)} />
                            </div>
                            <div>
                                <label style={label}>Key Highlights</label>
                                {exp.highlights.map((h, hi) => (
                                    <div key={hi} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <input style={input} placeholder="e.g. Improved API performance by 40%" value={h} onChange={e => updateHighlight(i, hi, e.target.value)} />
                                        {exp.highlights.length > 1 && <button style={removeBtn} onClick={() => removeHighlight(i, hi)}>✕</button>}
                                    </div>
                                ))}
                                <button style={addBtn} onClick={() => addHighlight(i)}>+ Add Highlight</button>
                            </div>
                        </div>
                    ))}
                    <button style={addBtn} onClick={() => setExperience([...experience, blankExp()])}>+ Add Experience</button>
                </div>

                {/* Projects */}
                <div style={card}>
                    <div style={sectionTitle}>🚀 Projects</div>
                    {projects.map((p, i) => (
                        <div key={i} style={entryBox}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <strong style={{ color: theme.colors.text }}>Project {i + 1}</strong>
                                {projects.length > 1 && <button style={removeBtn} onClick={() => setProjects(projects.filter((_, idx) => idx !== i))}>Remove</button>}
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={label}>Project Name *</label>
                                <input style={input} placeholder="SkillBridge Platform" value={p.name} onChange={e => updateProject(i, 'name', e.target.value)} />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={label}>Description</label>
                                <textarea style={{ ...input, minHeight: '60px', resize: 'vertical' }} placeholder="What the project does..." value={p.description} onChange={e => updateProject(i, 'description', e.target.value)} />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={label}>Technologies (comma-separated)</label>
                                <input style={input} placeholder="Go, React, MySQL, Docker" value={p.technologies} onChange={e => updateProject(i, 'technologies', e.target.value)} />
                            </div>
                            <div>
                                <label style={label}>Highlights</label>
                                {p.highlights.map((h, hi) => (
                                    <div key={hi} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <input style={input} placeholder="e.g. Built role-based dashboards" value={h} onChange={e => updateProjectHighlight(i, hi, e.target.value)} />
                                        {p.highlights.length > 1 && <button style={removeBtn} onClick={() => removeProjectHighlight(i, hi)}>✕</button>}
                                    </div>
                                ))}
                                <button style={addBtn} onClick={() => addProjectHighlight(i)}>+ Add Highlight</button>
                            </div>
                        </div>
                    ))}
                    <button style={addBtn} onClick={() => setProjects([...projects, blankProject()])}>+ Add Project</button>
                </div>

                {/* Education */}
                <div style={card}>
                    <div style={sectionTitle}>🎓 Education</div>
                    {education.map((edu, i) => (
                        <div key={i} style={entryBox}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <strong style={{ color: theme.colors.text }}>Entry {i + 1}</strong>
                                {education.length > 1 && <button style={removeBtn} onClick={() => setEducation(education.filter((_, idx) => idx !== i))}>Remove</button>}
                            </div>
                            <div style={{ ...grid2, marginBottom: '12px' }}>
                                <div><label style={label}>Institution *</label><input style={input} placeholder="Anna University" value={edu.institution} onChange={e => updateEdu(i, 'institution', e.target.value)} /></div>
                                <div><label style={label}>Degree</label><input style={input} placeholder="B.E. / B.Tech" value={edu.degree} onChange={e => updateEdu(i, 'degree', e.target.value)} /></div>
                            </div>
                            <div style={grid2}>
                                <div><label style={label}>Field of Study</label><input style={input} placeholder="Computer Science" value={edu.field} onChange={e => updateEdu(i, 'field', e.target.value)} /></div>
                                <div style={grid2}>
                                    <div><label style={label}>Start Year</label><input style={input} placeholder="2019" value={edu.startDate} onChange={e => updateEdu(i, 'startDate', e.target.value)} /></div>
                                    <div><label style={label}>End Year</label><input style={input} placeholder="2023" value={edu.endDate} onChange={e => updateEdu(i, 'endDate', e.target.value)} /></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button style={addBtn} onClick={() => setEducation([...education, blankEdu()])}>+ Add Education</button>
                </div>

                {/* Certifications */}
                <div style={card}>
                    <div style={sectionTitle}>🏅 Certifications</div>
                    {certifications.map((cert, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <input style={input} placeholder="AWS Certified Developer" value={cert.name} onChange={e => { const c = [...certifications]; c[i].name = e.target.value; setCertifications(c); }} />
                            {certifications.length > 1 && <button style={removeBtn} onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))}>✕</button>}
                        </div>
                    ))}
                    <button style={addBtn} onClick={() => setCertifications([...certifications, { name: '' }])}>+ Add Certification</button>
                </div>

                {/* Error */}
                {error && (
                    <div style={{ background: '#ff475720', border: '1px solid #ff4757', color: '#ff4757', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', wordBreak: 'break-all' }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Success */}
                {resumeUrl && (
                    <div style={{ background: '#2ed57320', border: '1px solid #2ed573', color: theme.colors.text, padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
                        <p style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>🎉 Your Resume is Ready!</p>
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
                            style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary || theme.colors.primary})`, color: 'white', padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '16px', display: 'inline-block' }}>
                            ⬇️ Download Resume
                        </a>
                    </div>
                )}

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    style={{
                        width: '100%',
                        background: loading ? theme.colors.border : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary || theme.colors.primary})`,
                        color: loading ? theme.colors.textSecondary : 'white',
                        border: 'none', padding: '16px', borderRadius: '12px',
                        fontSize: '18px', fontWeight: '700',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease', marginBottom: '40px'
                    }}
                >
                    {loading ? '⏳ Generating Resume...' : '🚀 Generate Resume'}
                </button>
            </div>
        </div>
    );
}

export default ResumeBuilder;
