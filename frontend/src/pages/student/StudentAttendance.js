import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Calendar as CalendarIcon, TrendingUp, AlertCircle,
    CheckCircle, XCircle, Flame, Star, ChevronLeft, ChevronRight
} from 'lucide-react';

const StudentAttendance = () => {
    const { userData } = useAuth();
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);

    // Mock Data
    const currentStats = {
        totalClasses: 120,
        present: 98,
        absent: 15,
        leaves: 7,
        percentage: 82,
        streak: 7,
        nextClassesNeeded: 3
    };

    // Animation for percentage count-up
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedPercentage(currentStats.percentage);
        }, 500);
        return () => clearTimeout(timer);
    }, [currentStats.percentage]);

    const getStatusMessage = () => {
        if (currentStats.percentage >= 75) {
            return {
                text: "Great! You're doing well this month! Keep it up.",
                type: "success"
            };
        } else {
            return {
                text: `Attend next ${currentStats.nextClassesNeeded} classes to stay safe and reach 75%!`,
                type: "warning"
            };
        }
    };

    const statusMsg = getStatusMessage();

    // Mock Calendar Data for visual demonstration
    const monthDays = Array.from({ length: 28 }, (_, i) => ({
        day: i + 1,
        status: Math.random() > 0.2 ? 'present' : 'absent'
    }));

    return (
        <div className="attendance-page page-transition-enter">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">Attendance Overview</h1>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <div className="streak-badge">
                            <Flame size={14} fill="white" /> {currentStats.streak} Day Streak
                        </div>
                        <div className="streak-badge" style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)' }}>
                            <Star size={14} fill="white" /> Perfect Week
                        </div>
                    </div>
                </div>
            </div>

            <div className="charts-container">
                {/* Animated Circular Progress */}
                <div className="chart-card secondary-chart">
                    <h3>Consistency Score</h3>
                    <div className="consistency-wrapper">
                        <div className="circular-chart">
                            <svg viewBox="0 0 36 36" className="circular-svg">
                                <path
                                    className="circle-bg"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="circle circular-progress-glow"
                                    strokeDasharray={`${animatedPercentage}, 100`}
                                    style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="percentage-text">
                                <span className="number">{animatedPercentage}%</span>
                                <span className="text" style={{ color: animatedPercentage >= 75 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                    {animatedPercentage >= 75 ? 'Safe' : 'Watch Out'}
                                </span>
                            </div>
                        </div>

                        <div className="status-message-box" style={{
                            borderLeftColor: statusMsg.type === 'success' ? 'var(--accent-success)' : 'var(--accent-warning)',
                            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(234, 179, 8, 0.05)'
                        }}>
                            {statusMsg.type === 'success' ? <CheckCircle className="icon-bounce" color="var(--accent-success)" /> : <AlertCircle className="icon-bounce" color="var(--accent-warning)" />}
                            <p style={{ margin: 0 }}>{statusMsg.text}</p>
                        </div>
                    </div>
                </div>

                {/* Animated Interactive Calendar */}
                <div className="chart-card main-chart">
                    <div className="chart-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CalendarIcon size={20} color="var(--accent-primary)" />
                            <h3 style={{ margin: 0 }}>Attendance Calendar</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-icon btn-secondary btn-sm"><ChevronLeft size={16} /></button>
                            <button className="btn btn-icon btn-secondary btn-sm"><ChevronRight size={16} /></button>
                        </div>
                    </div>

                    <div className="calendar-grid">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="calendar-day-header">{day}</div>
                        ))}
                        {/* Empty slots for spacing (mock) */}
                        <div className="calendar-day empty"></div>
                        <div className="calendar-day empty"></div>

                        {monthDays.map(item => (
                            <div
                                key={item.day}
                                className={`calendar-day ${item.status}`}
                                onClick={() => setSelectedDate(item)}
                            >
                                {item.day}
                                {item.status === 'present' && <div className="status-indicator"></div>}
                            </div>
                        ))}
                    </div>

                    {selectedDate && (
                        <div className="calendar-detail-popup fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>Feb {selectedDate.day}, 2026</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Status: <span style={{ color: selectedDate.status === 'present' ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 600 }}>
                                            {selectedDate.status === 'present' ? 'Present' : 'Absent'}
                                        </span>
                                    </span>
                                </div>
                                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDate(null)}>Close</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="history-list card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h3 className="card-title">Detailed Report</h3>
                    <button className="btn btn-primary btn-sm">Download PDF</button>
                </div>
                <div className="activity-rows">
                    {[1, 2, 3, 4, 5].map((d, i) => (
                        <div key={i} className="activity-row">
                            <div className="date-box">
                                <span className="day">{20 - i}</span>
                                <span className="mon">Feb</span>
                            </div>
                            <div className="status-line">
                                <div className={`status-dot ${i === 2 ? 'absent' : 'present'}`}></div>
                            </div>
                            <div className="details">
                                <div className="status-title">{i === 2 ? 'Absent' : 'Present'}</div>
                                <div className="status-time">9:00 AM - 4:00 PM</div>
                            </div>
                            <div className="streak-indicator">
                                {i !== 2 && <Flame size={16} color="#FF6B6B" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .charts-container {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 1.5rem;
                }
                
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 8px;
                    margin-top: 1rem;
                }
                
                .calendar-day-header {
                    text-align: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    padding-bottom: 8px;
                }
                
                .calendar-day {
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    background: var(--bg-tertiary);
                    position: relative;
                }
                
                .calendar-day.present {
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--accent-success);
                    font-weight: 600;
                }
                
                .calendar-day.absent {
                    background: rgba(220, 38, 38, 0.05);
                    color: var(--accent-danger);
                }
                
                .status-indicator {
                    position: absolute;
                    bottom: 4px;
                    width: 4px;
                    height: 4px;
                    background: var(--accent-success);
                    border-radius: 50%;
                }
                
                .calendar-detail-popup {
                    margin-top: 1.5rem;
                    padding: 1rem;
                    background: var(--bg-tertiary);
                    border-radius: var(--border-radius);
                    border-left: 4px solid var(--accent-primary);
                }

                .circular-chart {
                    position: relative;
                    width: 150px;
                    height: 150px;
                    margin: 0 auto;
                }
                .circular-svg {
                    transform: rotate(-90deg);
                }
                .circle-bg {
                    fill: none;
                    stroke: var(--bg-tertiary);
                    stroke-width: 2.5;
                }
                .circle {
                    fill: none;
                    stroke: var(--accent-success);
                    stroke-width: 2.5;
                    stroke-linecap: round;
                }
                .percentage-text {
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                }
                .percentage-text .number { display: block; font-size: 2rem; font-weight: 700; color: var(--text-primary); }
                .percentage-text .text { display: block; font-size: 0.8rem; color: var(--text-muted); }

                .activity-row {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    padding: 1rem 0;
                    border-bottom: 1px solid var(--border-color);
                }
                .activity-row:last-child { border-bottom: none; }
                .date-box {
                    background: var(--bg-tertiary);
                    padding: 0.5rem;
                    border-radius: 8px;
                    text-align: center;
                    min-width: 50px;
                }
                .date-box .day { display: block; font-weight: 700; font-size: 1.1rem; }
                .date-box .mon { display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); }
                
                .status-dot { width: 12px; height: 12px; border-radius: 50%; }
                .status-dot.present { background: var(--accent-success); box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
                .status-dot.absent { background: var(--accent-danger); box-shadow: 0 0 10px rgba(220, 38, 38, 0.4); }
                
                .status-title { font-weight: 600; font-size: 1rem; }
                .status-time { font-size: 0.8rem; color: var(--text-muted); }

                @media (max-width: 768px) {
                    .charts-container {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default StudentAttendance;
