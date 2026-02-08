import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, FileText, Users, Megaphone } from 'lucide-react';

const TeacherDashboard = () => {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        classesToday: 0,
        periodsToday: 0,
        pendingQuizzes: 0,
        totalStudents: 0
    });
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [recentNotices, setRecentNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    const getDayName = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    };

    const getUpdateTime = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate();
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    useEffect(() => {
        const fetchNotices = async () => {
            if (!userData?.college_id) return;
            try {
                // Fetch college notices and class notices for the class they are class teacher of
                const q = query(
                    collection(db, 'notices'),
                    where('college_id', '==', userData.college_id)
                );
                const snap = await getDocs(q);
                const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Filter: College wide OR notices they created OR notices for their assigned class
                const filtered = list.filter(n =>
                    n.target_type === 'college' ||
                    n.created_by === userData.uid ||
                    (n.target_type === 'class' && n.target_class_id === userData.class_id_assigned)
                ).sort((a, b) => b.created_at?.toMillis() - a.created_at?.toMillis()).slice(0, 5);

                setRecentNotices(filtered);
            } catch (err) {
                console.error("Error fetching notices:", err);
            }
        };
        fetchNotices();
    }, [userData]);

    useEffect(() => {
        const fetchData = async () => {
            if (!userData?.college_id || !userData?.uid) return;

            try {
                const today = getDayName();

                // Fetch today's timetable for this teacher
                const ttQuery = query(
                    collection(db, 'timetables'),
                    where('college_id', '==', userData.college_id),
                    where('teacher_id', '==', userData.uid)
                );
                const ttSnapshot = await getDocs(ttQuery);
                const allSlots = ttSnapshot.docs.map(doc => doc.data());

                const todaySlots = allSlots.filter(s => s.day === today).sort((a, b) => a.period - b.period);
                setTodaySchedule(todaySlots);

                // Unique classes today
                const uniqueClasses = [...new Set(todaySlots.map(s => s.class_id))];

                // Fetch pending quizzes (draft status)
                const quizQuery = query(
                    collection(db, 'quizzes'),
                    where('college_id', '==', userData.college_id),
                    where('created_by', '==', userData.uid)
                );
                const quizSnapshot = await getDocs(quizQuery);
                const draftQuizzes = quizSnapshot.docs.filter(doc => doc.data().status === 'draft');

                // If class teacher, count students
                let studentCount = 0;
                if (userData.is_class_teacher && userData.class_id_assigned) {
                    const studentQuery = query(
                        collection(db, 'students'),
                        where('college_id', '==', userData.college_id),
                        where('class_id', '==', userData.class_id_assigned)
                    );
                    const studentSnapshot = await getDocs(studentQuery);
                    studentCount = studentSnapshot.size;
                }

                setStats({
                    classesToday: uniqueClasses.length,
                    periodsToday: todaySlots.length,
                    pendingQuizzes: draftQuizzes.length,
                    totalStudents: studentCount
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userData]);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Teacher Dashboard</h1>
                    <p className="page-description">Welcome back, {userData?.name}! Today is {getDayName()}.</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <Calendar size={20} />
                    </div>
                    <div className="stat-value">{stats.classesToday}</div>
                    <div className="stat-label">Classes Today</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon success">
                        <Clock size={20} />
                    </div>
                    <div className="stat-value">{stats.periodsToday}</div>
                    <div className="stat-label">Periods Today</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon warning">
                        <FileText size={20} />
                    </div>
                    <div className="stat-value">{stats.pendingQuizzes}</div>
                    <div className="stat-label">Draft Quizzes</div>
                </div>

                {userData?.is_class_teacher && (
                    <div className="stat-card">
                        <div className="stat-icon danger">
                            <Users size={20} />
                        </div>
                        <div className="stat-value">{stats.totalStudents}</div>
                        <div className="stat-label">My Students</div>
                    </div>
                )}
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Today's Schedule</h3>
                    </div>
                    {todaySchedule.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No classes scheduled for today.</p>
                    ) : (
                        <div className="schedule-list">
                            {todaySchedule.map((slot, idx) => (
                                <div key={idx} className="schedule-item">
                                    <div className="schedule-period">
                                        <span className="badge badge-primary">P{slot.period}</span>
                                    </div>
                                    <div className="schedule-details">
                                        <div style={{ fontWeight: 500 }}>{slot.subject}</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                            {slot.is_lab && <span className="badge badge-secondary" style={{ marginRight: '0.5rem' }}>Lab</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Notices</h3>
                    </div>
                    <div className="updates-list stagger-list">
                        {recentNotices.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No recent notices.</p>
                        ) : (
                            recentNotices.map(notice => (
                                <div key={notice.id} className="update-item-modern">
                                    <div className={`update-icon-box ${notice.type === 'urgent' ? 'danger' : 'warning'}`} style={{
                                        background: notice.type === 'urgent' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: notice.type === 'urgent' ? '#ef4444' : '#f59e0b'
                                    }}>
                                        <Megaphone size={18} />
                                    </div>
                                    <div className="update-content">
                                        <div className="update-title" style={{ fontSize: '0.9rem' }}>{notice.title}</div>
                                        <div className="update-meta">
                                            {notice.author_name} • {getUpdateTime(notice.created_at)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <button
                            className="btn btn-secondary btn-sm btn-animate"
                            style={{ width: '100%', marginTop: '0.5rem' }}
                            onClick={() => navigate('/teacher/notices')}
                        >
                            View All Notices
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                }
                
                .update-item-modern {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.85rem;
                    background: var(--bg-tertiary);
                    border-radius: 12px;
                    margin-bottom: 0.75rem;
                }
                
                .update-icon-box {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .update-content {
                    flex: 1;
                    min-width: 0;
                }

                .update-title {
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .update-meta {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .schedule-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .schedule-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem;
                    background-color: var(--bg-primary);
                    border-radius: var(--border-radius);
                    border: 1px solid var(--border-color);
                }

                .schedule-period {
                    min-width: 40px;
                }
            `}</style>
        </div>
    );
};

export default TeacherDashboard;
