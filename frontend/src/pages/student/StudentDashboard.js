import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
    Calendar, FileText, BookOpen, TrendingUp, TrendingDown,
    Activity, Clock, AlertTriangle, Download, ChevronRight, CheckCircle,
    Flame, Star, Trophy, Bell, Zap, PlayCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        materials: 0,
        quizzes: 0,
        attendance: 0,
        pendingAssignments: 0,
        streak: 7
    });
    const [loading, setLoading] = useState(true);

    const getDayName = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!userData?.college_id || !userData?.class_id) return;

            try {
                // Count materials
                const matsQuery = query(
                    collection(db, 'materials'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', userData.class_id)
                );
                const matsSnapshot = await getDocs(matsQuery);

                // Count active quizzes
                const quizQuery = query(
                    collection(db, 'quizzes'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', userData.class_id),
                    where('status', '==', 'active')
                );
                const quizSnapshot = await getDocs(quizQuery);

                // Calculate attendance percentage
                const attQuery = query(
                    collection(db, 'attendance_records'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', userData.class_id)
                );
                const attSnapshot = await getDocs(attQuery);

                let presentCount = 0;
                attSnapshot.docs.forEach(doc => {
                    if (doc.data().present?.includes(userData.pin)) {
                        presentCount++;
                    }
                });
                const attPercentage = attSnapshot.size > 0 ? Math.round((presentCount / attSnapshot.size) * 100) : 100;

                setStats({
                    materials: matsSnapshot.size,
                    quizzes: quizSnapshot.size,
                    attendance: attPercentage,
                    pendingAssignments: 3,
                    streak: 7
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userData]);

    if (loading) {
        return (
            <div className="dashboard">
                <div className="page-header skeleton" style={{ width: '50%', height: '40px', marginBottom: '2rem' }}></div>
                <div className="stats-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="stat-card skeleton" style={{ height: '140px' }}></div>
                    ))}
                </div>
                <div className="skeleton" style={{ height: '300px', width: '100%' }}></div>
            </div>
        );
    }

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="dashboard page-transition-enter">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">{getGreeting()}, {userData?.name.split(' ')[0]}! ✨</h1>
                    <p className="page-description">
                        <Calendar size={14} style={{ display: 'inline', marginRight: '5px' }} />
                        {getDayName()}, {new Date().toLocaleDateString()}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="streak-badge">
                        <Flame size={16} fill="white" /> {stats.streak} Day Streak
                    </div>
                    <div className="streak-badge" style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)' }}>
                        <Trophy size={16} fill="white" /> Top 10%
                    </div>
                </div>
            </div>

            {/* Attendance Safety Message */}
            <div className={`status-message-box ${stats.attendance >= 75 ? 'success' : 'warning'}`} style={{
                borderLeftColor: stats.attendance >= 75 ? 'var(--accent-success)' : 'var(--accent-warning)',
                background: stats.attendance >= 75 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(234, 179, 8, 0.05)'
            }}>
                {stats.attendance >= 75 ?
                    <CheckCircle className="icon-bounce" color="var(--accent-success)" /> :
                    <AlertTriangle className="icon-bounce" color="var(--accent-warning)" />
                }
                <p style={{ margin: 0, fontWeight: 500 }}>
                    {stats.attendance >= 75 ?
                        "Great job! Your attendance is on track. 🌟" :
                        "Heads up! Your attendance is below 75%. Let's prioritize the next few sessions!"
                    }
                </p>
            </div>

            {/* Quick Actions */}
            <section className="quick-actions-section" style={{ margin: '2rem 0' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Quick Actions</h3>
                <div className="quick-actions-grid">
                    <button className="quick-action-btn" onClick={() => navigate('/student/quizzes')}>
                        <div className="qa-icon primary"><FileText size={20} /></div>
                        <span>Take Quiz</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/student/materials')}>
                        <div className="qa-icon success"><Download size={20} /></div>
                        <span>Materials</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/student/concerns')}>
                        <div className="qa-icon warning"><AlertTriangle size={20} /></div>
                        <span>Raise Concern</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/student/timetable')}>
                        <div className="qa-icon info"><Clock size={20} /></div>
                        <span>Timetable</span>
                    </button>
                </div>
            </section>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card" onClick={() => navigate('/student/attendance')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <div className="stat-label">Attendance</div>
                            <div className="stat-value" style={{ color: stats.attendance >= 75 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{stats.attendance}%</div>
                        </div>
                        <div className={`trend-badge ${stats.attendance >= 75 ? 'success' : 'danger'}`}>
                            {stats.attendance >= 75 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {stats.attendance >= 75 ? '+2%' : '-5%'}
                        </div>
                    </div>
                </div>

                <div className="stat-card" onClick={() => navigate('/student/quizzes')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <div className="stat-label">Pending Quizzes</div>
                            <div className="stat-value">{stats.quizzes}</div>
                        </div>
                        <div className="stat-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-primary)', padding: '8px', borderRadius: '10px' }}>
                            <Zap size={20} fill="var(--accent-primary)" />
                        </div>
                    </div>
                </div>

                <div className="stat-card" onClick={() => navigate('/student/materials')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <div className="stat-label">New Content</div>
                            <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{stats.materials}</div>
                        </div>
                        <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', padding: '8px', borderRadius: '10px' }}>
                            <PlayCircle size={20} fill="var(--accent-success)" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Learning Journey / Recent Updates */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Bell size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            Recent Updates
                        </h3>
                        <span className="badge badge-primary">New</span>
                    </div>
                    <div className="updates-list">
                        <div className="update-item-modern">
                            <div className="update-icon-box primary"><FileText size={18} /></div>
                            <div className="update-content">
                                <div className="update-title">New Quiz: Java Inheritance</div>
                                <div className="update-meta">Posted by Dr. Sharma • 2 hours ago</div>
                            </div>
                            <button className="btn btn-secondary btn-sm">Solve</button>
                        </div>
                        <div className="update-item-modern">
                            <div className="update-icon-box success"><Download size={18} /></div>
                            <div className="update-content">
                                <div className="update-title">Web Tech Notes - Module 3</div>
                                <div className="update-meta">Materials updated • 5 hours ago</div>
                            </div>
                            <button className="btn btn-secondary btn-sm">View</button>
                        </div>
                        <div className="update-item-modern">
                            <div className="update-icon-box warning"><AlertTriangle size={18} /></div>
                            <div className="update-content">
                                <div className="update-title">Mid-term Schedule Released</div>
                                <div className="update-meta">Examination Cell • Yesterday</div>
                            </div>
                            <button className="btn btn-secondary btn-sm">Read</button>
                        </div>
                    </div>
                </div>

                {/* Progress Card */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Activity size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            Your Progress
                        </h3>
                    </div>
                    <div className="progress-section">
                        <div className="subject-progress">
                            <div className="sp-header">
                                <span>Java Programming</span>
                                <span className="sp-percent">88%</span>
                            </div>
                            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: '88%', background: 'var(--accent-primary)' }}></div></div>
                        </div>
                        <div className="subject-progress" style={{ marginTop: '1.25rem' }}>
                            <div className="sp-header">
                                <span>Web Technologies</span>
                                <span className="sp-percent">62%</span>
                            </div>
                            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: '62%', background: 'var(--accent-warning)' }}></div></div>
                        </div>
                        <div className="subject-progress" style={{ marginTop: '1.25rem' }}>
                            <div className="sp-header">
                                <span>Database Systems</span>
                                <span className="sp-percent">45%</span>
                            </div>
                            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: '45%', background: 'var(--accent-secondary)' }}></div></div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>View Analytics</button>
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                }
                
                .quick-actions-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.25rem;
                }
                
                .quick-action-btn {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem 1.25rem;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 18px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    color: var(--text-primary);
                    font-weight: 700;
                    font-size: 0.9rem;
                    box-shadow: var(--shadow-sm);
                }
                
                .quick-action-btn:hover {
                    transform: translateY(-8px);
                    background: white;
                    box-shadow: 0 15px 30px -10px rgba(124, 58, 237, 0.25);
                    border-color: var(--accent-primary);
                }
                
                .qa-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: all 0.3s;
                }
                
                .quick-action-btn:hover .qa-icon {
                    transform: rotate(-10deg) scale(1.1);
                }
                
                .qa-icon.primary { background: linear-gradient(135deg, #7C3AED, #A78BFA); color: white; }
                .qa-icon.success { background: linear-gradient(135deg, #10B981, #34D399); color: white; }
                .qa-icon.warning { background: linear-gradient(135deg, #F59E0B, #FBBF24); color: white; }
                .qa-icon.info { background: linear-gradient(135deg, #3B82F6, #60A5FA); color: white; }
                
                .update-item-modern {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: var(--bg-tertiary);
                    border-radius: 12px;
                    margin-bottom: 0.75rem;
                    transition: all 0.2s;
                }
                
                .update-item-modern:hover {
                    transform: scale(1.02);
                    background: white;
                    box-shadow: var(--shadow-sm);
                }
                
                .update-icon-box {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .update-icon-box.primary { background: rgba(124, 58, 237, 0.1); color: var(--accent-primary); }
                .update-icon-box.success { background: rgba(16, 185, 129, 0.1); color: var(--accent-success); }
                .update-icon-box.warning { background: rgba(234, 179, 8, 0.1); color: var(--accent-warning); }
                
                .update-content {
                    flex: 1;
                }
                
                .update-title {
                    font-weight: 700;
                    font-size: 0.95rem;
                }
                
                .update-meta {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                
                .subject-progress {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .sp-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                
                .sp-percent {
                    color: var(--accent-primary);
                }

                @media (max-width: 768px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }
                    .quick-actions-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `}</style>
        </div>
    );
};

export default StudentDashboard;
