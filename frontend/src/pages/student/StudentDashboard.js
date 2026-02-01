import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Calendar, FileText, BookOpen, TrendingUp } from 'lucide-react';

const StudentDashboard = () => {
    const { userData } = useAuth();
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [stats, setStats] = useState({
        materials: 0,
        quizzes: 0,
        attendance: 0
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
                // Get today's timetable
                const ttQuery = query(
                    collection(db, 'timetables'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', userData.class_id),
                    where('day', '==', getDayName())
                );
                const ttSnapshot = await getDocs(ttQuery);
                const schedule = ttSnapshot.docs.map(doc => doc.data()).sort((a, b) => a.period - b.period);
                setTodaySchedule(schedule);

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
                    attendance: attPercentage
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
        return <div className="loading"><div className="spinner"></div>Loading...</div>;
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Student Dashboard</h1>
                    <p className="page-description">Welcome back, {userData?.name}! Today is {getDayName()}.</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon success">
                        <TrendingUp size={20} />
                    </div>
                    <div className="stat-value">{stats.attendance}%</div>
                    <div className="stat-label">Attendance</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <FileText size={20} />
                    </div>
                    <div className="stat-value">{stats.quizzes}</div>
                    <div className="stat-label">Active Quizzes</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon warning">
                        <BookOpen size={20} />
                    </div>
                    <div className="stat-value">{stats.materials}</div>
                    <div className="stat-label">Materials</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title"><Calendar size={16} style={{ marginRight: '0.5rem' }} />Today's Schedule</h3>
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
                                    {slot.is_lab && <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>Lab</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
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

export default StudentDashboard;
