import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, X, Calendar } from 'lucide-react';

const TimetableManagement = () => {
    const { userData } = useAuth();
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState({ day: '', period: 0 });
    const [formData, setFormData] = useState({
        teacher_id: '',
        subject: '',
        is_lab: false
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!userData?.college_id) return;

            try {
                // Fetch classes
                const classesQuery = query(collection(db, 'classes'), where('college_id', '==', userData.college_id));
                const classesSnapshot = await getDocs(classesQuery);
                const classesList = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClasses(classesList);

                // Fetch teachers
                const teachersQuery = query(collection(db, 'teachers'), where('college_id', '==', userData.college_id));
                const teachersSnapshot = await getDocs(teachersQuery);
                const teachersList = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTeachers(teachersList);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [userData]);

    const fetchTimetable = async (classId) => {
        if (!classId) {
            setTimetable([]);
            return;
        }

        try {
            const ttQuery = query(
                collection(db, 'timetables'),
                where('college_id', '==', userData.college_id),
                where('class_id', '==', classId)
            );
            const ttSnapshot = await getDocs(ttQuery);
            const ttList = ttSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTimetable(ttList);
        } catch (err) {
            console.error("Error fetching timetable:", err);
        }
    };

    useEffect(() => {
        if (selectedClass) {
            fetchTimetable(selectedClass);
        }
    }, [selectedClass]);

    const getSlot = (day, period) => {
        return timetable.find(t => t.day === day && t.period === period);
    };

    const getTeacherName = (teacherId) => {
        const teacher = teachers.find(t => t.uid === teacherId || t.id === teacherId);
        return teacher ? teacher.name : '-';
    };

    const openSlotModal = (day, period) => {
        const existingSlot = getSlot(day, period);
        setEditingSlot({ day, period });
        setFormData({
            teacher_id: existingSlot?.teacher_id || '',
            subject: existingSlot?.subject || '',
            is_lab: existingSlot?.is_lab || false
        });
        setShowModal(true);
    };

    const handleSaveSlot = async (e) => {
        e.preventDefault();

        try {
            // Delete existing slot if any
            const existingSlot = getSlot(editingSlot.day, editingSlot.period);
            if (existingSlot) {
                await deleteDoc(doc(db, 'timetables', existingSlot.id));
            }

            // Add new slot if subject is provided
            if (formData.subject.trim()) {
                await addDoc(collection(db, 'timetables'), {
                    college_id: userData.college_id,
                    class_id: selectedClass,
                    day: editingSlot.day,
                    period: editingSlot.period,
                    teacher_id: formData.teacher_id,
                    subject: formData.subject,
                    is_lab: formData.is_lab
                });
            }

            setShowModal(false);
            fetchTimetable(selectedClass);
        } catch (err) {
            console.error("Error saving slot:", err);
        }
    };

    const handleDeleteSlot = async () => {
        const existingSlot = getSlot(editingSlot.day, editingSlot.period);
        if (existingSlot) {
            await deleteDoc(doc(db, 'timetables', existingSlot.id));
            setShowModal(false);
            fetchTimetable(selectedClass);
        }
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
        <div className="timetable-management">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Timetable Management</h1>
                    <p className="page-description">Create and manage class timetables.</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select Class</label>
                    <select
                        className="form-select"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        style={{ maxWidth: '400px' }}
                    >
                        <option value="">Choose a class to view/edit timetable</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.branch} - Section {cls.section} (Year {cls.year}, Sem {cls.semester})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedClass ? (
                <div className="timetable-wrapper">
                    <div className="timetable-grid">
                        {/* Header Row */}
                        <div className="timetable-header">Day</div>
                        {periods.map(p => (
                            <div key={p} className="timetable-header">
                                P{p}
                                {p === 4 && <div style={{ fontSize: '0.625rem' }}>Lunch After</div>}
                            </div>
                        ))}

                        {/* Day Rows */}
                        {days.map(day => (
                            <React.Fragment key={day}>
                                <div className="timetable-day">{day.substring(0, 3)}</div>
                                {periods.map(period => {
                                    const slot = getSlot(day, period);
                                    return (
                                        <div
                                            key={`${day}-${period}`}
                                            className={`timetable-cell ${slot?.is_lab ? 'is-lab' : ''} ${slot?.subject === 'Study Hour' ? 'is-study' : ''}`}
                                            onClick={() => openSlotModal(day, period)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {slot ? (
                                                <>
                                                    <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{slot.subject}</div>
                                                    {slot.teacher_id && (
                                                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                                            {getTeacherName(slot.teacher_id)}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                    <Plus size={12} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.8125rem' }}>
                        <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'rgba(139, 92, 246, 0.2)', marginRight: '4px' }}></span> Lab</span>
                        <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'rgba(34, 197, 94, 0.2)', marginRight: '4px' }}></span> Study Hour</span>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <Calendar size={40} />
                    <p>Select a class to view or edit its timetable</p>
                </div>
            )}

            {/* Slot Edit Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">{editingSlot.day} - Period {editingSlot.period}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveSlot}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Subject</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Mathematics"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Teacher</label>
                                    <select
                                        className="form-select"
                                        value={formData.teacher_id}
                                        onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                    >
                                        <option value="">Select teacher</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.uid}>{t.name} ({t.uid})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={formData.is_lab}
                                            onChange={(e) => setFormData({ ...formData, is_lab: e.target.checked })}
                                        />
                                        <span>This is a Lab period</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                {getSlot(editingSlot.day, editingSlot.period) && (
                                    <button type="button" className="btn btn-danger" onClick={handleDeleteSlot} style={{ marginRight: 'auto' }}>
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                )}
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Slot
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .timetable-wrapper {
                    overflow-x: auto;
                }
            `}</style>
        </div>
    );
};

export default TimetableManagement;
