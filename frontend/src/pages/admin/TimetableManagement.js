import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, getDoc, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, X, Calendar, AlertCircle, GripVertical, Info, RefreshCcw } from 'lucide-react';

const TimetableManagement = () => {
    const { userData } = useAuth();
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [settings, setSettings] = useState({
        working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        periods_per_day: 8,
        lunch_after_period: 4
    });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState({ day: '', period: 0 });
    const [formData, setFormData] = useState({
        teacher_id: '',
        subject: '',
        is_lab: false
    });
    const [draggingSubject, setDraggingSubject] = useState(null);
    const [conflicts, setConflicts] = useState({});

    const days = settings.working_days;
    const periods = Array.from({ length: settings.periods_per_day }, (_, i) => i + 1);

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

                // Fetch subjects
                const subjectsQuery = query(collection(db, 'subjects'), where('college_id', '==', userData.college_id));
                const subjectsSnapshot = await getDocs(subjectsQuery);
                setSubjects(subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Fetch college settings
                const collegeDoc = await getDoc(doc(db, 'colleges', userData.college_id));
                if (collegeDoc.exists() && collegeDoc.data().settings) {
                    setSettings(collegeDoc.data().settings);
                }
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

    const getAssignedSubjectsForClass = () => {
        if (!selectedClass) return [];
        const classObj = classes.find(c => c.id === selectedClass);
        if (!classObj || !classObj.subject_sessions) return [];

        return Object.entries(classObj.subject_sessions).map(([subId, sessions]) => {
            const subject = subjects.find(s => s.id === subId);
            const isLab = subject?.type === 'lab';
            const assignedTeacher = teachers.find(t =>
                t.subject_assignments?.some(a => a.subject_id === subId && a.class_id === selectedClass)
            );

            // Count placed periods
            const placedPeriods = timetable.filter(t => t.subject === (subject?.name || 'Unknown')).length;

            // For labs, 3 periods = 1 session
            const placedSessions = isLab ? placedPeriods / 3 : placedPeriods;

            return {
                id: subId,
                name: subject?.name || 'Unknown',
                code: subject?.code || '???',
                type: subject?.type || 'theory',
                teacher_id: assignedTeacher?.uid || null,
                teacher_name: assignedTeacher?.name || 'No Teacher',
                required_sessions: sessions,
                placed_sessions: placedSessions
            };
        }).filter(s => s.required_sessions > 0);
    };

    const validateMove = async (sub, targetDay, targetPeriod, skipIds = []) => {
        const subName = sub.name || sub.subject;
        if (subName === 'Study Hour') return null;

        // 1. Teacher Occupancy Check (Global)
        if (sub.teacher_id) {
            const ttQuery = query(
                collection(db, 'timetables'),
                where('college_id', '==', userData.college_id),
                where('teacher_id', '==', sub.teacher_id),
                where('day', '==', targetDay),
                where('period', '==', targetPeriod)
            );
            const ttSnapshot = await getDocs(ttQuery);
            const conflicts = ttSnapshot.docs.filter(d => !skipIds.includes(d.id));

            if (conflicts.length > 0) {
                const conflict = conflicts[0].data();
                const otherClass = classes.find(c => c.id === conflict.class_id);
                return `Teacher ${sub.teacher_name || 'assigned to this subject'} is already busy in ${otherClass ? otherClass.branch + ' ' + otherClass.section : 'another class'}.`;
            }
        }

        // 2. Daily Limit Check (Local to this class)
        const daySlots = timetable.filter(t => t.day === targetDay && t.subject === subName && !skipIds.includes(t.id));
        if (sub.type !== 'lab' && subName !== 'Study Hour' && daySlots.length >= 2) {
            return `Theory subject ${subName} already has 2 periods on ${targetDay}.`;
        }

        // 3. Adjacency Check
        const adjacent = timetable.find(t =>
            t.day === targetDay &&
            (t.period === targetPeriod - 1 || t.period === targetPeriod + 1) &&
            t.subject === subName &&
            !skipIds.includes(t.id)
        );
        if (sub.type !== 'lab' && subName !== 'Study Hour' && adjacent) {
            return `Consecutive periods of ${subName} are not allowed.`;
        }

        return null;
    };

    const onDragStart = (e, item) => {
        setDraggingSubject(item);
        e.dataTransfer.setData('application/json', JSON.stringify(item));
    };

    const onDrop = async (e, day, period) => {
        e.preventDefault();
        e.stopPropagation();

        const rawData = e.dataTransfer.getData('application/json');
        if (!rawData) return;

        const data = JSON.parse(rawData);
        const existingSlotId = data.id && data.day ? data.id : null;
        const isLab = data.type === 'lab' || data.is_lab || false;
        const slotsNeeded = isLab ? 3 : 1;

        // Collect all IDs to skip if we are moving an existing block
        let skipIds = [];
        if (existingSlotId) {
            if (isLab && data.day) {
                const labSiblings = timetable.filter(s =>
                    s.day === data.day &&
                    s.subject === (data.name || data.subject) &&
                    s.teacher_id === data.teacher_id
                );
                skipIds = labSiblings.map(s => s.id);
            } else {
                skipIds = [existingSlotId];
            }
        }

        if (isLab) {
            if (period + slotsNeeded - 1 > settings.periods_per_day) {
                alert(`Lab requires ${slotsNeeded} periods. Cannot place here.`);
                return;
            }
        }

        // Validate all slots BEFORE committing any changes
        for (let i = 0; i < slotsNeeded; i++) {
            const currentPeriod = period + i;
            const subForVal = { ...data };
            const error = await validateMove(subForVal, day, currentPeriod, skipIds);
            if (error) {
                alert(`Cannot place ${data.name || data.subject} at Period ${currentPeriod}: ${error}`);
                return; // STRICT BLOCKING
            }
        }

        try {
            const batch = writeBatch(db);

            // Delete old source slots if moving
            skipIds.forEach(id => {
                batch.delete(doc(db, 'timetables', id));
            });

            // Prepare new target slots
            for (let i = 0; i < slotsNeeded; i++) {
                const targetP = period + i;
                const targetSlot = getSlot(day, targetP);

                // Overwrite any existing slot at target (unless it's the one we're moving)
                if (targetSlot && !skipIds.includes(targetSlot.id)) {
                    batch.delete(doc(db, 'timetables', targetSlot.id));
                }

                const newRef = doc(collection(db, 'timetables'));
                batch.set(newRef, {
                    college_id: userData.college_id,
                    class_id: selectedClass,
                    day,
                    period: targetP,
                    teacher_id: data.teacher_id || null,
                    subject: data.name || data.subject,
                    is_lab: isLab
                });
            }

            await batch.commit();
            fetchTimetable(selectedClass);
        } catch (err) {
            console.error("Error dropping slot:", err);
            alert("Failed to update timetable. Please try again.");
        }
    };

    const handleResetTimetable = async () => {
        if (!selectedClass) return;
        if (!window.confirm("Are you sure you want to clear the ENTIRE timetable for this class? This cannot be undone.")) return;

        setLoading(true);
        try {
            const ttQuery = query(
                collection(db, 'timetables'),
                where('college_id', '==', userData.college_id),
                where('class_id', '==', selectedClass)
            );
            const ttSnapshot = await getDocs(ttQuery);
            const batch = writeBatch(db);
            ttSnapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            await fetchTimetable(selectedClass);
            alert("Timetable reset successfully.");
        } catch (err) {
            console.error("Error resetting timetable:", err);
            alert("Failed to reset timetable.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSlot = async (slotId) => {
        if (!window.confirm("Remove this session/period?")) return;
        try {
            const slot = timetable.find(s => s.id === slotId);
            if (!slot) return;

            if (slot.is_lab) {
                // Find all sibling slots for this lab session on the same day
                const siblings = timetable.filter(s =>
                    s.day === slot.day &&
                    s.subject === slot.subject &&
                    s.teacher_id === slot.teacher_id &&
                    Math.abs(s.period - slot.period) <= 2
                );

                const batch = writeBatch(db);
                siblings.forEach(s => batch.delete(doc(db, 'timetables', s.id)));
                await batch.commit();
            } else {
                await deleteDoc(doc(db, 'timetables', slotId));
            }
            fetchTimetable(selectedClass);
        } catch (err) {
            console.error("Error deleting slot:", err);
        }
    };

    const assignedSubjects = getAssignedSubjectsForClass();
    const theorySubjects = assignedSubjects.filter(s => s.type !== 'lab');
    const labSubjects = assignedSubjects.filter(s => s.type === 'lab');

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
                    <p className="page-description">Manual drag-and-drop timetable builder.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {selectedClass && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleResetTimetable}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                        >
                            <RefreshCcw size={16} /> Reset Timetable
                        </button>
                    )}
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
                        <option value="">Choose a class to build timetable</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.branch} - Section {cls.section} (Year {cls.year}, Sem {cls.semester})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedClass ? (
                <div className="timetable-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Top Bar: Assigned Subjects */}
                    <div className="subjects-topbar card" style={{ padding: '1rem', position: 'sticky', top: '0', zIndex: 10 }}>

                        <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>

                            {/* Theory Section */}
                            <div style={{ minWidth: '300px', borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                    <Info size={16} /> Theory Subjects & Others
                                </h3>
                                <div className="subject-list" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {/* Study Hour Option */}
                                    <div
                                        draggable
                                        onDragStart={(e) => onDragStart(e, { name: 'Study Hour', teacher_id: null, type: 'study' })}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '6px',
                                            border: '1px dashed var(--border-color)',
                                            cursor: 'grab',
                                            background: 'var(--bg-secondary)',
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            minWidth: '120px'
                                        }}
                                    >
                                        <GripVertical size={14} style={{ color: 'var(--text-muted)' }} />
                                        <span style={{ fontWeight: 500 }}>Study Hour</span>
                                    </div>

                                    {theorySubjects.map(sub => (
                                        <div
                                            key={sub.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, sub)}
                                            style={{
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '6px',
                                                background: 'var(--bg-secondary)',
                                                border: `1px solid ${sub.placed_sessions >= sub.required_sessions ? 'var(--success)' : 'var(--border-color)'}`,
                                                cursor: 'grab',
                                                minWidth: '160px',
                                                maxWidth: '200px'
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                                {sub.teacher_name}
                                            </div>
                                            {/* Progress Bar */}
                                            <div style={{ height: '3px', background: 'var(--border-color)', borderRadius: '2px', width: '100%' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${Math.min(100, (sub.placed_sessions / sub.required_sessions) * 100)}%`,
                                                    background: sub.placed_sessions >= sub.required_sessions ? 'var(--success)' : 'var(--accent-primary)',
                                                    borderRadius: '2px'
                                                }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Labs Section */}
                            <div style={{ flex: 1, minWidth: '300px' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                    <Info size={16} /> Labs (Takes 3 Periods)
                                </h3>
                                <div className="subject-list" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {labSubjects.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No labs assigned</span>}
                                    {labSubjects.map(sub => (
                                        <div
                                            key={sub.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, sub)}
                                            style={{
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '6px',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                border: `1px solid ${sub.placed_sessions >= sub.required_sessions ? 'var(--success)' : 'var(--accent-primary)'}`,
                                                cursor: 'grab',
                                                minWidth: '160px',
                                                maxWidth: '200px'
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '2px', color: 'var(--accent-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                                {sub.teacher_name}
                                            </div>
                                            {/* Progress Bar */}
                                            <div style={{ height: '3px', background: 'var(--border-color)', borderRadius: '2px', width: '100%' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${Math.min(100, (sub.placed_sessions / sub.required_sessions) * 100)}%`,
                                                    background: sub.placed_sessions >= sub.required_sessions ? 'var(--success)' : 'var(--accent-primary)',
                                                    borderRadius: '2px'
                                                }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Main Grid: Timetable */}
                    <div className="timetable-wrapper-outer" style={{ overflow: 'hidden' }}>
                        <div className="timetable-wrapper card" style={{ padding: '1rem', overflowX: 'auto', background: 'var(--bg-primary)' }}>
                            <div className="timetable-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: `80px repeat(${settings.periods_per_day}, minmax(120px, 1fr))`,
                                gap: '4px',
                                minWidth: `${80 + (settings.periods_per_day * 120)}px`
                            }}>
                                {/* Header Row */}
                                <div className="timetable-header" style={{ leading: '0.5rem', fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>Day</div>
                                {periods.map(p => (
                                    <div key={p} className="timetable-header" style={{ padding: '0.5rem', fontWeight: 600, fontSize: '0.75rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                                        P{p}
                                        {p === settings.lunch_after_period && <div style={{ fontSize: '0.5rem', color: 'var(--accent-primary)' }}>Lunch After</div>}
                                    </div>
                                ))}

                                {/* Day Rows */}
                                {days.map(day => (
                                    <React.Fragment key={day}>
                                        <div className="timetable-day" style={{ padding: '0.75rem 0.5rem', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-color)' }}>
                                            {day.substring(0, 3)}
                                        </div>
                                        {periods.map(period => {
                                            const slot = getSlot(day, period);
                                            return (
                                                <div
                                                    key={`${day}-${period}`}
                                                    className={`timetable-cell ${slot?.is_lab ? 'is-lab' : ''}`}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => onDrop(e, day, period)}
                                                    style={{
                                                        minHeight: '80px',
                                                        padding: '0.5rem',
                                                        background: slot ? (slot.subject === 'Study Hour' ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-secondary)') : 'transparent',
                                                        border: '1px dashed var(--border-color)',
                                                        borderRadius: '6px',
                                                        transition: 'all 0.2s',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {slot ? (
                                                        <div
                                                            draggable
                                                            onDragStart={(e) => onDragStart(e, { ...slot, name: slot.subject, type: slot.is_lab ? 'lab' : 'theory' })}
                                                            style={{ height: '100%', cursor: 'grab' }}
                                                        >
                                                            <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '4px' }}>{slot.subject}</div>
                                                            {slot.teacher_id && (
                                                                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                                                                    {getTeacherName(slot.teacher_id)}
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveSlot(slot.id); }}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '4px',
                                                                    right: '4px',
                                                                    padding: '2px',
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: 'var(--danger)',
                                                                    cursor: 'pointer',
                                                                    opacity: 0.6
                                                                }}
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.625rem' }}>
                                                            Drop here
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <Calendar size={40} />
                    <p>Select a class to start building the timetable</p>
                </div>
            )}

            <style>{`
                .timetable-cell.is-lab {
                    border-left: 4px solid var(--accent-primary) !important;
                }
                .timetable-cell:hover {
                    border-color: var(--accent-primary) !important;
                    background: rgba(139, 92, 246, 0.05) !important;
                }
                .timetable-wrapper::-webkit-scrollbar, .subjects-topbar > div::-webkit-scrollbar {
                    height: 8px;
                }
                .timetable-wrapper::-webkit-scrollbar-track, .subjects-topbar > div::-webkit-scrollbar-track {
                    background: var(--bg-secondary);
                    border-radius: 4px;
                }
                .timetable-wrapper::-webkit-scrollbar-thumb, .subjects-topbar > div::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 4px;
                }
                .timetable-wrapper::-webkit-scrollbar-thumb:hover, .subjects-topbar > div::-webkit-scrollbar-thumb:hover {
                    background: var(--text-muted);
                }
            `}</style>
        </div>
    );
};

export default TimetableManagement;
