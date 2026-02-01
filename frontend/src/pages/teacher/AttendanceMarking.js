import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { CheckCircle, XCircle, Save, Loader2 } from 'lucide-react';

const AttendanceMarking = () => {
    const { userData } = useAuth();
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedPeriod, setSelectedPeriod] = useState('1');
    const [attendance, setAttendance] = useState({});
    const [existingRecord, setExistingRecord] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const periods = [1, 2, 3, 4, 5, 6, 7, 8];

    useEffect(() => {
        const fetchClasses = async () => {
            if (!userData?.college_id) return;

            try {
                // Fetch all classes teacher is assigned to via teaching_assignments or as class teacher
                const assignmentQuery = query(
                    collection(db, 'teaching_assignments'),
                    where('college_id', '==', userData.college_id),
                    where('teacher_id', '==', userData.uid)
                );
                const assignmentSnapshot = await getDocs(assignmentQuery);
                const assignedClassIds = [...new Set(assignmentSnapshot.docs.map(doc => doc.data().class_id))];

                // Add class teacher's class if applicable
                if (userData.is_class_teacher && userData.class_id_assigned) {
                    if (!assignedClassIds.includes(userData.class_id_assigned)) {
                        assignedClassIds.push(userData.class_id_assigned);
                    }
                }

                // Fetch class details
                const classesQuery = query(
                    collection(db, 'classes'),
                    where('college_id', '==', userData.college_id)
                );
                const classesSnapshot = await getDocs(classesQuery);
                const allClasses = classesSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(cls => assignedClassIds.includes(cls.id));

                setClasses(allClasses);
            } catch (error) {
                console.error('Error fetching classes:', error);
            }
        };

        fetchClasses();
    }, [userData]);

    useEffect(() => {
        const fetchStudentsAndRecord = async () => {
            if (!selectedClass || !selectedDate || !selectedPeriod) return;

            setLoading(true);
            try {
                // Fetch students for selected class
                const studentsQuery = query(
                    collection(db, 'students'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', selectedClass)
                );
                const studentsSnapshot = await getDocs(studentsQuery);
                const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStudents(studentsList);

                // Check for existing attendance record
                const attQuery = query(
                    collection(db, 'attendance_records'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', selectedClass),
                    where('date', '==', selectedDate),
                    where('period', '==', parseInt(selectedPeriod))
                );
                const attSnapshot = await getDocs(attQuery);

                if (!attSnapshot.empty) {
                    const record = { id: attSnapshot.docs[0].id, ...attSnapshot.docs[0].data() };
                    setExistingRecord(record);

                    // Pre-populate attendance
                    const attMap = {};
                    studentsList.forEach(s => {
                        if (record.present?.includes(s.pin)) {
                            attMap[s.pin] = 'present';
                        } else if (record.absent?.includes(s.pin)) {
                            attMap[s.pin] = 'absent';
                        }
                    });
                    setAttendance(attMap);
                } else {
                    setExistingRecord(null);
                    // Default all to present
                    const attMap = {};
                    studentsList.forEach(s => {
                        attMap[s.pin] = 'present';
                    });
                    setAttendance(attMap);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentsAndRecord();
    }, [selectedClass, selectedDate, selectedPeriod, userData]);

    const toggleAttendance = (pin) => {
        // Only allow editing if teacher is class teacher or admin, or if no existing record
        if (existingRecord && !userData.is_class_teacher && userData.role !== 'admin') {
            return;
        }

        setAttendance(prev => ({
            ...prev,
            [pin]: prev[pin] === 'present' ? 'absent' : 'present'
        }));
    };

    const handleSubmit = async () => {
        if (!selectedClass || !selectedDate || !selectedPeriod) {
            setMessage({ type: 'error', text: 'Please select class, date, and period.' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const present = Object.entries(attendance)
                .filter(([_, status]) => status === 'present')
                .map(([pin]) => pin);
            const absent = Object.entries(attendance)
                .filter(([_, status]) => status === 'absent')
                .map(([pin]) => pin);

            const recordData = {
                college_id: userData.college_id,
                class_id: selectedClass,
                date: selectedDate,
                period: parseInt(selectedPeriod),
                present,
                absent,
                marked_by: userData.uid,
                marked_at: new Date()
            };

            if (existingRecord) {
                await updateDoc(doc(db, 'attendance_records', existingRecord.id), recordData);
            } else {
                await addDoc(collection(db, 'attendance_records'), recordData);
            }

            setMessage({ type: 'success', text: 'Attendance saved successfully!' });

            // Refresh to show updated record
            setExistingRecord({ ...recordData, id: existingRecord?.id || 'new' });
        } catch (error) {
            console.error('Error saving attendance:', error);
            setMessage({ type: 'error', text: 'Failed to save attendance. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const canEdit = !existingRecord || userData.is_class_teacher || userData.role === 'admin';
    const presentCount = Object.values(attendance).filter(v => v === 'present').length;
    const absentCount = Object.values(attendance).filter(v => v === 'absent').length;

    return (
        <div className="attendance-marking">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Mark Attendance</h1>
                    <p className="page-description">Record period-wise attendance for your classes.</p>
                </div>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="form-row" style={{ marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Class</label>
                        <select
                            className="form-select"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">Select Class</option>
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
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Period</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {periods.map(p => (
                            <button
                                key={p}
                                className={`btn btn-sm ${selectedPeriod === String(p) ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSelectedPeriod(String(p))}
                            >
                                Period {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {existingRecord && (
                <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                    Attendance already marked by {existingRecord.marked_by}.
                    {canEdit ? ' You can edit this record.' : ' Only class teacher or admin can edit.'}
                </div>
            )}

            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    Loading students...
                </div>
            ) : selectedClass && students.length > 0 ? (
                <>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <span className="badge badge-success">Present: {presentCount}</span>
                        <span className="badge badge-danger">Absent: {absentCount}</span>
                    </div>

                    <div className="attendance-list">
                        {students.map(student => (
                            <div
                                key={student.id}
                                className="attendance-item"
                                onClick={() => canEdit && toggleAttendance(student.pin)}
                                style={{ cursor: canEdit ? 'pointer' : 'not-allowed', opacity: canEdit ? 1 : 0.7 }}
                            >
                                <div className="attendance-student">
                                    <code className="attendance-pin">{student.pin}</code>
                                    <span style={{ fontWeight: 500 }}>{student.name}</span>
                                </div>
                                <div>
                                    {attendance[student.pin] === 'present' ? (
                                        <span className="badge badge-success">
                                            <CheckCircle size={12} style={{ marginRight: '4px' }} />
                                            Present
                                        </span>
                                    ) : (
                                        <span className="badge badge-danger">
                                            <XCircle size={12} style={{ marginRight: '4px' }} />
                                            Absent
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {canEdit && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className="spinner" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        {existingRecord ? 'Update Attendance' : 'Submit Attendance'}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </>
            ) : selectedClass ? (
                <div className="empty-state">
                    <p>No students found in this class.</p>
                </div>
            ) : (
                <div className="empty-state">
                    <p>Select a class, date, and period to mark attendance.</p>
                </div>
            )}
        </div>
    );
};

export default AttendanceMarking;
