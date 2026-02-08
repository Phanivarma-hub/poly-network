import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    X,
    Edit2,
    Trash2,
    Info,
    CheckCircle
} from 'lucide-react';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    deleteDoc,
    orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import CalendarEntryModal from '../../components/CalendarEntryModal';
import '../../styles/calendar.css';

const AcademicCalendar = () => {
    const { userData } = useAuth();
    const role = userData?.role;
    const collegeId = userData?.college_id || userData?.collegeId;


    const [currentDate, setCurrentDate] = useState(new Date());
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState(null);
    const [classes, setClasses] = useState([]);

    // Fetch classes for admin dropdown and teacher/student filtering
    useEffect(() => {
        const fetchClasses = async () => {
            if (!collegeId) return;
            try {
                // Try both naming conventions for class fetch
                let q = query(collection(db, 'classes'), where('college_id', '==', collegeId));
                let querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    q = query(collection(db, 'classes'), where('collegeId', '==', collegeId));
                    querySnapshot = await getDocs(q);
                }

                const classesData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        display_name: `${data.branch} - Sec ${data.section} (Year ${data.year})`
                    };
                });

                setClasses(classesData);
            } catch (error) {
                console.error("Error fetching classes:", error);
            }
        };
        fetchClasses();
    }, [collegeId]);

    const fetchEntries = useCallback(async () => {
        if (!collegeId) {
            // If userData exists but collegeId is missing, we should stop loading
            if (userData) setLoading(false);
            return;
        }
        setLoading(true);

        try {
            const calendarRef = collection(db, 'calendar_entries');
            // Check both naming conventions for compatibility
            let q = query(calendarRef, where('college_id', '==', collegeId));

            let querySnapshot = await getDocs(q);

            // Fallback to old name if no results (for backward compatibility during migration)
            if (querySnapshot.empty) {
                const q2 = query(calendarRef, where('collegeId', '==', collegeId));
                querySnapshot = await getDocs(q2);
            }

            let entriesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Frontend filtering based on target for Teacher and Student
            // Firestore 'IN' query could be used for teacher classes, but for simplicity 
            // and handling the 'all' case easily, we'll filter entries in memory for now
            // as the volume is usually low for a calendar.
            if (role === 'student') {
                entriesData = entriesData.filter(entry =>
                    entry.target.type === 'all' ||
                    entry.target.class_id === (userData.class_id || userData.classId) ||
                    entry.target.classId === (userData.class_id || userData.classId)
                );
            } else if (role === 'teacher') {
                // If it's a teacher, show entries for their assigned classes or 'all'
                const teacherClasses = userData.assigned_classes || [];
                entriesData = entriesData.filter(entry =>
                    entry.target.type === 'all' ||
                    teacherClasses.includes(entry.target.class_id) ||
                    teacherClasses.includes(entry.target.classId)
                );
            }


            setEntries(entriesData);
        } catch (error) {
            console.error("Error fetching calendar entries:", error);
        } finally {
            setLoading(false);
        }
    }, [collegeId, role, userData]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleDeleteEntry = async (entryId) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            try {
                await deleteDoc(doc(db, 'calendar_entries', entryId));
                setSelectedEntry(null);
                fetchEntries();
            } catch (error) {
                console.error("Error deleting entry:", error);
                alert("Failed to delete entry");
            }
        }
    };

    const handleEditEntry = (entry) => {
        setEntryToEdit(entry);
        setSelectedEntry(null);
        setIsModalOpen(true);
    };

    const handleAddEntry = () => {
        setEntryToEdit(null);
        setIsModalOpen(true);
    };

    // Calendar Helper Functions
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = getFirstDayOfMonth(year, month);
        const today = new Date();

        const days = [];

        // Month prefix (days from previous month)
        const prevMonthDays = getDaysInMonth(year, month - 1);
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                month: month - 1,
                year,
                otherMonth: true
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                month: month,
                year,
                currentMonth: true
            });
        }

        // Month suffix (days from next month)
        const remainingCells = 42 - days.length; // 6 rows of 7 days
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                day: i,
                month: month + 1,
                year,
                otherMonth: true
            });
        }

        return days.map((dateObj, index) => {
            const dateString = `${dateObj.year}-${String(dateObj.month + 1).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
            const dayEntries = entries.filter(e => e.date === dateString);
            const isToday = today.getDate() === dateObj.day &&
                today.getMonth() === dateObj.month &&
                today.getFullYear() === dateObj.year;

            return (
                <div
                    key={index}
                    className={`calendar-day ${dateObj.otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => {
                        if (dayEntries.length > 0) {
                            setSelectedEntry(dayEntries[0]);
                        }
                    }}
                >
                    <div className="day-number">{dateObj.day}</div>
                    <div className="day-entries">
                        {dayEntries.slice(0, 3).map((entry) => (
                            <div
                                key={entry.id}
                                className={`entry-badge ${entry.type}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEntry(entry);
                                }}
                            >
                                {entry.title}
                            </div>
                        ))}
                        {dayEntries.length > 3 && (
                            <div className="more-entries">+{dayEntries.length - 3} more</div>
                        )}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="calendar-page">
            <div className="calendar-header">
                <h2>Academic Calendar</h2>
                <div className="calendar-controls">
                    <div className="calendar-nav">
                        <button onClick={prevMonth}><ChevronLeft size={20} /></button>
                        <div className="calendar-month-year">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </div>
                        <button onClick={nextMonth}><ChevronRight size={20} /></button>
                        <button onClick={goToToday} className="btn-today">Today</button>
                    </div>
                    {role === 'admin' && (
                        <div className="calendar-actions">
                            <button onClick={handleAddEntry}>
                                <Plus size={20} /> Add Entry
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="calendar-grid">
                <div className="calendar-weekdays">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="calendar-weekday">{day}</div>
                    ))}
                </div>
                <div className="calendar-days">
                    {loading ? (
                        <div className="calendar-loading">Loading calendar...</div>
                    ) : renderCalendar()}
                </div>
            </div>

            <div className="calendar-legend">
                <div className="legend-item">
                    <div className="legend-dot holiday"></div>
                    <span>Holiday</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot event"></div>
                    <span>Event</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot exam"></div>
                    <span>Exam</span>
                </div>
            </div>

            {/* Entry Detail Popup */}
            {selectedEntry && (
                <div className="entry-detail-overlay" onClick={() => setSelectedEntry(null)}>
                    <div className="entry-detail-panel" onClick={e => e.stopPropagation()}>
                        <div className="entry-detail-header">
                            <div>
                                <span className={`entry-type-badge ${selectedEntry.type}`}>
                                    {selectedEntry.type}
                                </span>
                                <h3>{selectedEntry.title}</h3>
                            </div>
                            <button className="entry-detail-close" onClick={() => setSelectedEntry(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="entry-detail-body">
                            <div className="entry-detail-row">
                                <CalendarIcon size={18} />
                                <span>{new Date(selectedEntry.date).toLocaleDateString('en-US', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                })}</span>
                            </div>
                            {selectedEntry.time && (
                                <div className="entry-detail-row">
                                    <Clock size={18} />
                                    <span>{selectedEntry.time}</span>
                                </div>
                            )}
                            <div className="entry-detail-row">
                                <Info size={18} />
                                <span>
                                    Target: {selectedEntry.target.type === 'all'
                                        ? 'All Classes'
                                        : `Class: ${classes.find(c => c.id === (selectedEntry.target.class_id || selectedEntry.target.classId))?.display_name || 'Specific Class'}`
                                    }
                                </span>

                            </div>
                            {selectedEntry.description && (
                                <div className="entry-detail-row description">
                                    <div style={{ marginTop: '2px' }}><Info size={18} opacity={0} /></div>
                                    <span>{selectedEntry.description}</span>
                                </div>
                            )}
                        </div>
                        {role === 'admin' && (
                            <div className="entry-detail-actions">
                                <button className="btn-edit" onClick={() => handleEditEntry(selectedEntry)}>
                                    <Edit2 size={16} /> Edit
                                </button>
                                <button className="btn-delete" onClick={() => handleDeleteEntry(selectedEntry.id)}>
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <CalendarEntryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchEntries();
                    }}
                    entry={entryToEdit}
                    classes={classes}
                    collegeId={collegeId}
                />
            )}
        </div>
    );
};

export default AcademicCalendar;
