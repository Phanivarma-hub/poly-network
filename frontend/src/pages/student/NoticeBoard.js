import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, Users, GraduationCap, Clock, AlertCircle, Calendar } from 'lucide-react';

const NoticeBoard = () => {
    const { userData } = useAuth();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotices = async () => {
            if (!userData?.college_id || !userData?.class_id) return;
            setLoading(true);
            try {
                // Fetch college-wide notices
                const collegeQ = query(
                    collection(db, 'notices'),
                    where('college_id', '==', userData.college_id),
                    where('target_type', '==', 'college')
                );

                // Fetch class-specific notices
                const classQ = query(
                    collection(db, 'notices'),
                    where('college_id', '==', userData.college_id),
                    where('target_type', '==', 'class'),
                    where('target_class_id', '==', userData.class_id)
                );

                const [collegeSnap, classSnap] = await Promise.all([
                    getDocs(collegeQ),
                    getDocs(classQ)
                ]);

                const collegeNotices = collegeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const classNotices = classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Combine and sort by date
                const allNotices = [...collegeNotices, ...classNotices].sort((a, b) =>
                    b.created_at?.toMillis() - a.created_at?.toMillis()
                );

                setNotices(allNotices);
            } catch (err) {
                console.error("Error fetching notices:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotices();
    }, [userData]);

    if (loading) return <div className="loading"><div className="spinner"></div>Loading notice board...</div>;

    return (
        <div className="notice-board-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Notice Board</h1>
                    <p className="page-description">General circulars and class-specific announcements.</p>
                </div>
            </div>

            <div className="notices-container">
                {notices.length === 0 ? (
                    <div className="empty-state">
                        <Megaphone size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h3>No notices yet</h3>
                        <p>When there are new announcements, they will appear here.</p>
                    </div>
                ) : (
                    <div className="notices-list stagger-list">
                        {notices.map(notice => (
                            <div key={notice.id} className={`notice-card ${notice.type || 'info'}`}>
                                <div className="notice-card-header">
                                    <div className="notice-meta">
                                        {notice.target_type === 'college' ? (
                                            <span className="badge badge-secondary"><Users size={12} /> College Wide</span>
                                        ) : (
                                            <span className="badge badge-primary"><GraduationCap size={12} /> My Class</span>
                                        )}
                                        <span className="notice-date">
                                            <Calendar size={12} />
                                            {notice.created_at?.toDate().toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <h3 className="notice-title">
                                        {notice.type === 'urgent' && <AlertCircle size={18} className="urgent-icon" />}
                                        {notice.title}
                                    </h3>
                                </div>
                                <div className="notice-content">
                                    <p>{notice.content}</p>
                                </div>
                                <div className="notice-footer">
                                    <div className="author-info">
                                        <div className="author-avatar">{notice.author_name?.charAt(0)}</div>
                                        <div>
                                            <div className="author-name">{notice.author_name}</div>
                                            <div className="author-role">{notice.author_role}</div>
                                        </div>
                                    </div>
                                    <div className="notice-time">
                                        <Clock size={12} />
                                        {notice.created_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .notices-container {
                    padding: 1rem 0;
                }
                .notices-list {
                    display: grid;
                    gap: 1.5rem;
                    max-width: 800px;
                }
                .notice-card {
                    background: var(--bg-primary);
                    border-radius: 16px;
                    padding: 1.5rem;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    transition: transform 0.2s;
                }
                .notice-card:hover {
                    transform: translateY(-2px);
                }
                .notice-card.urgent {
                    border-left: 4px solid #ef4444;
                }
                .notice-card.warning {
                    border-left: 4px solid #f59e0b;
                }
                .notice-card.info {
                    border-left: 4px solid #3b82f6;
                }
                .notice-card-header {
                    margin-bottom: 1rem;
                }
                .notice-meta {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 0.75rem;
                }
                .notice-date {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .notice-title {
                    font-size: 1.25rem;
                    color: var(--text-primary);
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .urgent-icon {
                    color: #ef4444;
                }
                .notice-content {
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                    white-space: pre-wrap;
                }
                .notice-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border-color);
                }
                .author-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .author-avatar {
                    width: 32px;
                    height: 32px;
                    background: var(--primary-color);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.875rem;
                }
                .author-name {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .author-role {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: capitalize;
                }
                .notice-time {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
            `}} />
        </div>
    );
};

export default NoticeBoard;
