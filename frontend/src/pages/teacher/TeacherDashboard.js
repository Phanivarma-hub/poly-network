import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Calendar, Clock, FileText, Users } from 'lucide-react';

const TeacherDashboard = () => {
    const { userData } = useAuth();
    const [stats, setStats] = useState({
        classesToday: 0,
        periodsToday: 0,
        pendingQuizzes: 0,
        totalStudents: 0
    });
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    const getDayName = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    };

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

export default TeacherDashboard;
