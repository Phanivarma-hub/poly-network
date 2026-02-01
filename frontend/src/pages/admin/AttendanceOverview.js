import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Search, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const AttendanceOverview = () => {
    const { userData } = useAuth();
    const [classes, setClasses] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [expandedRecord, setExpandedRecord] = useState(null);

    useEffect(() => {
        const fetchClasses = async () => {
            if (!userData?.college_id) return;

            try {
                const classesQuery = query(collection(db, 'classes'), where('college_id', '==', userData.college_id));
                const classesSnapshot = await getDocs(classesQuery);
                const classesList = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClasses(classesList);
            } catch (err) {
                console.error("Error fetching classes:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, [userData]);

    const fetchAttendance = async () => {
        if (!userData?.college_id) return;

        try {
            let attQuery = query(
                collection(db, 'attendance_records'),
                where('college_id', '==', userData.college_id),
                where('date', '==', selectedDate)
            );

            if (selectedClass) {
                attQuery = query(
                    collection(db, 'attendance_records'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', selectedClass),
                    where('date', '==', selectedDate)
                );
            }

            const attSnapshot = await getDocs(attQuery);
            const attList = attSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAttendanceRecords(attList.sort((a, b) => a.period - b.period));
        } catch (err) {
            console.error("Error fetching attendance:", err);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [selectedClass, selectedDate, userData]);

    const getClassName = (classId) => {
        const cls = classes.find(c => c.id === classId);
        return cls ? `${cls.branch} - ${cls.section}` : classId;
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                Loading...
            </div>
        );
    }

    return (
        <div className="attendance-overview">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance Overview</h1>
                    <p className="page-description">View and monitor attendance records across all classes.</p>
                </div>
            </div>

            <div className="filters card" style={{ marginBottom: '1.5rem' }}>
                <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Filter by Class</label>
                        <select
                            className="form-select"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">All Classes</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.branch} - Section {cls.section}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {attendanceRecords.length === 0 ? (
                <div className="empty-state">
                    <Calendar size={40} />
                    <p>No attendance records found for the selected filters.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Period</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Marked By</th>
                                <th style={{ width: '80px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceRecords.map(record => (
                                <React.Fragment key={record.id}>
                                    <tr>
                                        <td style={{ fontWeight: 500 }}>{getClassName(record.class_id)}</td>
                                        <td><span className="badge badge-primary">Period {record.period}</span></td>
                                        <td>
                                            <span className="badge badge-success">{record.present?.length || 0}</span>
                                        </td>
                                        <td>
                                            <span className="badge badge-danger">{record.absent?.length || 0}</span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{record.marked_by}</td>
                                        <td>
                                            <button
                                                className="btn btn-secondary btn-sm btn-icon"
                                                onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                                            >
                                                {expandedRecord === record.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRecord === record.id && (
                                        <tr>
                                            <td colSpan="6" style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                    <div>
                                                        <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--accent-success)' }}>Present Students</h4>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                            {record.present?.map(pin => (
                                                                <code key={pin} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '4px' }}>
                                                                    {pin}
                                                                </code>
                                                            ))}
                                                            {(!record.present || record.present.length === 0) && (
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>None</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--accent-danger)' }}>Absent Students</h4>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                            {record.absent?.map(pin => (
                                                                <code key={pin} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                                                                    {pin}
                                                                </code>
                                                            ))}
                                                            {(!record.absent || record.absent.length === 0) && (
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>None</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AttendanceOverview;
