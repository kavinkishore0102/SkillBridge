import React, { useState, useEffect } from 'react';
import { useTheme } from './contexts/ThemeContext';
import { utils, interviewAPI } from './utils/api';
import { useNavigate } from 'react-router-dom';

const InterviewPrep = () => {
    const [activeTab, setActiveTab] = useState('videos');
    const [searchQuery, setSearchQuery] = useState('');
    const [resources, setResources] = useState({ videos: [], questions: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const token = utils.getToken();
                if (!token) {
                    navigate('/');
                    return;
                }

                const data = await interviewAPI.getInterviewResources(token);
                setResources(data);
            } catch (err) {
                console.error('Error fetching interview resources:', err);
                setError('Failed to load interview resources. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, [navigate]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: theme.colors.background,
                color: theme.colors.text
            }}>
                Loading resources...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: theme.colors.danger,
                backgroundColor: theme.colors.background,
                minHeight: '100vh'
            }}>
                {error}
            </div>
        );
    }

    const groupBySkill = (items) => {
        const grouped = {};
        items.forEach(item => {
            if (!grouped[item.skill]) {
                grouped[item.skill] = [];
            }
            grouped[item.skill].push(item);
        });
        return grouped;
    };

    const currentItems = activeTab === 'videos' ? resources.videos : resources.questions;

    // Filter items based on search query
    const filteredItems = currentItems.filter(item => {
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase();
        return (
            item.title.toLowerCase().includes(query) ||
            item.skill.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query)) ||
            (item.content && item.content.toLowerCase().includes(query))
        );
    });

    const groupedItems = groupBySkill(filteredItems);

    return (
        <div style={{
            backgroundColor: theme.colors.background,
            minHeight: '100vh',
            padding: '20px',
            color: theme.colors.text,
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <h1 style={{
                    fontSize: '32px',
                    marginBottom: '10px',
                    color: theme.colors.primary,
                    textAlign: 'center'
                }}>
                    Interview Preparation
                </h1>
                <p style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    color: theme.colors.textSecondary
                }}>
                    Curated resources based on your skills to help you ace your interviews.
                </p>

                {/* Search Bar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '30px'
                }}>
                    <input
                        type="text"
                        placeholder="Search for a skill, video title, or question..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            maxWidth: '600px',
                            padding: '14px 20px',
                            fontSize: '16px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.colors.border}`,
                            backgroundColor: theme.colors.card,
                            color: theme.colors.text,
                            outline: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = theme.colors.primary;
                            e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primary}20, 0 4px 12px rgba(0,0,0,0.1)`;
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = theme.colors.border;
                            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                        }}
                    />
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '30px',
                    borderBottom: `2px solid ${theme.colors.border}`
                }}>
                    <button
                        onClick={() => setActiveTab('videos')}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: '600',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'videos' ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                            color: activeTab === 'videos' ? theme.colors.primary : theme.colors.textSecondary,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        📺 Video Tutorials
                    </button>
                    <button
                        onClick={() => setActiveTab('questions')}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: '600',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'questions' ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                            color: activeTab === 'questions' ? theme.colors.primary : theme.colors.textSecondary,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        ❓ Interview Questions
                    </button>
                </div>

                {/* Content */}
                {Object.keys(groupedItems).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme.colors.textSecondary }}>
                        No resources found for your current skills. Try adding more skills to your profile!
                    </div>
                ) : (
                    Object.keys(groupedItems).map(skill => (
                        <div key={skill} style={{ marginBottom: '40px' }}>
                            <h2 style={{
                                textTransform: 'capitalize',
                                borderBottom: `1px solid ${theme.colors.border}`,
                                paddingBottom: '10px',
                                marginBottom: '20px',
                                color: theme.colors.text
                            }}>
                                {skill}
                            </h2>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '20px'
                            }}>
                                {groupedItems[skill].map(item => (
                                    <div key={item.id} style={{
                                        backgroundColor: theme.colors.card,
                                        borderRadius: '8px',
                                        padding: '20px',
                                        boxShadow: theme.shadows.card,
                                        border: `1px solid ${theme.colors.border}`,
                                        transition: 'transform 0.2s ease'
                                    }}>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            backgroundColor: item.difficulty === 'Beginner' ? '#2ecc7120' :
                                                item.difficulty === 'Intermediate' ? '#f1c40f20' : '#e74c3c20',
                                            color: item.difficulty === 'Beginner' ? '#2ecc71' :
                                                item.difficulty === 'Intermediate' ? '#f1c40f' : '#e74c3c',
                                            marginBottom: '10px'
                                        }}>
                                            {item.difficulty}
                                        </div>

                                        <h3 style={{
                                            margin: '0 0 10px 0',
                                            fontSize: '18px',
                                            color: theme.colors.text
                                        }}>
                                            {item.title}
                                        </h3>

                                        {activeTab === 'videos' ? (
                                            <>
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: theme.colors.textSecondary,
                                                    marginBottom: '15px'
                                                }}>
                                                    {item.description}
                                                </p>
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-block',
                                                        padding: '8px 16px',
                                                        backgroundColor: theme.colors.primary,
                                                        color: 'white',
                                                        textDecoration: 'none',
                                                        borderRadius: '4px',
                                                        fontSize: '14px',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    Watch Video ↗
                                                </a>
                                            </>
                                        ) : (
                                            <div style={{
                                                marginTop: '10px',
                                                padding: '10px',
                                                backgroundColor: theme.colors.background,
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                lineHeight: '1.5',
                                                color: theme.colors.text
                                            }}>
                                                {item.content}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default InterviewPrep;
