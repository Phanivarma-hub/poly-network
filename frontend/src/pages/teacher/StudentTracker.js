import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Users, TrendingUp, AlertTriangle, Phone } from 'lucide-react';

const StudentTracker = () => {
    const { userData } = useAuth();
    const [students, setStudents] = useState([]);
    const [attendanceStats, setAttendanceStats] = useState({});
    const [quizStats, setQuizStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!userData?.college_id || !userData?.class_id_assigned) return;

            try {
                // Fetch students in this class
                const studentsQuery = query(
                    collection(db, 'students'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', userData.class_id_assigned)
                );
                const studentsSnapshot = await getDocs(studentsQuery);
                const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStudents(studentsList);

                // Fetch attendance records for this class
                const attQuery = query(
                    collection(db, 'attendance_records'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', userData.class_id_assigned)
                );
                const attSnapshot = await getDocs(attQuery);

                // Calculate attendance percentage per student
                const attStats = {};
                const totalRecords = attSnapshot.size;

                studentsList.forEach(s => {
                    let presentCount = 0;
                    attSnapshot.docs.forEach(doc => {
                        if (doc.data().present?.includes(s.pin)) {
                            presentCount++;
                        }
                    });
                    attStats[s.pin] = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 100;
                });
                setAttendanceStats(attStats);

                // Fetch quiz attempts
                const quizQuery = query(
                    collection(db, 'quizzes'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', userData.class_id_assigned)
                );
                const quizSnapshot = await getDocs(quizQuery);
                const quizIds = quizSnapshot.docs.map(doc => doc.id);

                const qStats = {};
                for (const student of studentsList) {
                    let totalMarks = 0;
                    let attemptCount = 0;

                    for (const quizId of quizIds) {
                        const attemptQuery = query(
                            collection(db, 'quiz_attempts'),
                            where('quiz_id', '==', quizId),
                            where('student_id', '==', student.pin)
                        );
                        const attemptSnapshot = await getDocs(attemptQuery);
                        if (!attemptSnapshot.empty) {
                            attemptCount++;
                            totalMarks += attemptSnapshot.docs[0].data().score || 0;
                        }
                    }

                    qStats[student.pin] = attemptCount > 0 ? Math.round(totalMarks / attemptCount) : null;
                }
                setQuizStats(qStats);

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userData]);

    const getAttendanceBadge = (percentage) => {
        if (percentage >= 75) return <span className="badge badge-success">{percentage}%</span>;
        if (percentage >= 50) return <span className="badge badge-warning">{percentage}%</span>;
        return <span className="badge badge-danger">{percentage}%</span>;
    };

    const handleParentAlert = (student) => {
        // Simulate sending alert
        alert(`Alert sent to parent at ${student.parent_phone} for student ${student.name}`);
    };

    if (!userData?.is_class_teacher) {
        return (
            <div className="empty-state">
                <AlertTriangle size={40} />
                <p>This feature is only available for class teachers.</p>
            </div>
        );
    }

    if (loading) {
        return <div className="loading"><div className="spinner"></div>Loading tracker...</div>;
    }

    return (
        <div className="student-tracker">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Student Tracker</h1>
                    <p className="page-description">Monitor your students' attendance and performance.</p>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon primary"><Users size={20} /></div>
                    <div className="stat-value">{students.length}</div>
                    <div className="stat-label">Total Students</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon warning"><AlertTriangle size={20} /></div>
                    <div className="stat-value">
                        {Object.values(attendanceStats).filter(v => v < 75).length}
                    </div>
                    <div className="stat-label">Low Attendance</div>
                </div>
            </div>

            {students.length === 0 ? (
                <div className="empty-state">
                    <Users size={40} />
                    <p>No students enrolled in your class yet.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>PIN</th>
                                <th>Name</th>
                                <th>Attendance</th>
                                <th>Avg Quiz Score</th>
                                <th>Parent Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id}>
                                    <td><code style={{ color: 'var(--accent-primary)' }}>{student.pin}</code></td>
                                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                                    <td>{getAttendanceBadge(attendanceStats[student.pin] || 100)}</td>
                                    <td>
                                        {quizStats[student.pin] !== null ? (
                                            <span className="badge badge-primary">{quizStats[student.pin]}%</span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>No attempts</span>
                                        )}
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{student.parent_phone || '-'}</td>
                                    <td>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleParentAlert(student)}
                                            disabled={!student.parent_phone}
                                        >
                                            <Phone size={14} /> Alert Parent
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StudentTracker;
