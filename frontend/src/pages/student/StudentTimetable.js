import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Calendar } from 'lucide-react';

const StudentTimetable = () => {
    const { userData } = useAuth();
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];

    const getDayName = () => {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return dayNames[new Date().getDay()];
    };

    useEffect(() => {
        const fetchTimetable = async () => {
            if (!userData?.college_id || !userData?.class_id) return;

            try {
                const ttQuery = query(
                    collection(db, 'timetables'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', userData.class_id)
                );
                const snapshot = await getDocs(ttQuery);
                setTimetable(snapshot.docs.map(doc => doc.data()));
            } catch (error) {
                console.error('Error fetching timetable:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTimetable();
    }, [userData]);

    const getSlot = (day, period) => {
        return timetable.find(t => t.day === day && t.period === period);
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div>Loading timetable...</div>;
    }

    return (
        <div className="timetable-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Timetable</h1>
                    <p className="page-description">Your weekly class schedule.</p>
                </div>
            </div>

            {timetable.length === 0 ? (
                <div className="empty-state">
                    <Calendar size={40} />
                    <p>Timetable not available yet.</p>
                </div>
            ) : (
                <div className="timetable-wrapper">
                    <div className="timetable-grid">
                        <div className="timetable-header">Day</div>
                        {periods.map(p => (
                            <div key={p} className="timetable-header">P{p}</div>
                        ))}

                        {days.map(day => (
                            <React.Fragment key={day}>
                                <div className={`timetable-day ${day === getDayName() ? 'today' : ''}`}>
                                    {day.substring(0, 3)}
                                    {day === getDayName() && <span style={{ fontSize: '0.625rem', display: 'block' }}>Today</span>}
                                </div>
                                {periods.map(period => {
                                    const slot = getSlot(day, period);
                                    return (
                                        <div
                                            key={`${day}-${period}`}
                                            className={`timetable-cell ${slot?.is_lab ? 'is-lab' : ''} ${slot?.subject === 'Study Hour' ? 'is-study' : ''} ${slot && day === getDayName() ? 'today-slot' : ''}`}
                                        >
                                            {slot ? (
                                                <>
                                                    <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{slot.subject}</div>
                                                    {slot.is_lab && <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Lab</span>}
                                                </>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .timetable-wrapper { overflow-x: auto; }
                .timetable-day.today {
                    background-color: rgba(99, 102, 241, 0.2);
                    color: var(--accent-primary);
                }
                .timetable-cell.today-slot {
                    background-color: rgba(99, 102, 241, 0.1);
                    border-left: 3px solid var(--accent-primary);
                }
            `}</style>
        </div>
    );
};

export default StudentTimetable;
