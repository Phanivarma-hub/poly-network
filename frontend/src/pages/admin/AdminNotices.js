import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Edit2, X, Megaphone, Users, GraduationCap, Clock, AlertCircle } from 'lucide-react';

const AdminNotices = () => {
    const { userData } = useAuth();
    const [notices, setNotices] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingNotice, setEditingNotice] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        target_type: 'college', // 'college' or 'class'
        target_class_id: '',
        type: 'info' // 'info', 'warning', 'urgent'
    });

    const fetchNotices = async () => {
        if (!userData?.college_id) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, 'notices'),
                where('college_id', '==', userData.college_id),
                orderBy('created_at', 'desc')
            );
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotices(list);
        } catch (err) {
            console.error("Error fetching notices:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        if (!userData?.college_id) return;
        try {
            const q = query(collection(db, 'classes'), where('college_id', '==', userData.college_id));
            const snapshot = await getDocs(q);
            setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Error fetching classes:", err);
        }
    };

    useEffect(() => {
        fetchNotices();
        fetchClasses();
    }, [userData]);

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            target_type: 'college',
            target_class_id: '',
            type: 'info'
        });
        setEditingNotice(null);
    };

    const openModal = (notice = null) => {
        if (notice) {
            setEditingNotice(notice);
            setFormData({
                title: notice.title,
                content: notice.content,
                target_type: notice.target_type,
                target_class_id: notice.target_class_id || '',
                type: notice.type || 'info'
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const noticeData = {
                college_id: userData.college_id,
                title: formData.title,
                content: formData.content,
                target_type: formData.target_type,
                target_class_id: formData.target_type === 'class' ? formData.target_class_id : null,
                type: formData.type,
                created_by: userData.uid,
                author_name: userData.name,
                author_role: userData.role,
                created_at: editingNotice ? editingNotice.created_at : Timestamp.now(),
                updated_at: Timestamp.now()
            };

            if (editingNotice) {
                await updateDoc(doc(db, 'notices', editingNotice.id), noticeData);
            } else {
                const docRef = await addDoc(collection(db, 'notices'), noticeData);

                // Also create a notification for students
                const notificationData = {
                    college_id: userData.college_id,
                    type: 'notice',
                    title: `New Notice: ${formData.title}`,
                    content: formData.content.substring(0, 100) + '...',
                    target_type: formData.target_type,
                    target_id: formData.target_type === 'class' ? formData.target_class_id : userData.college_id,
                    link: '/student/notices',
                    created_at: Timestamp.now(),
                    created_by: userData.uid,
                    author_name: userData.name
                };
                await addDoc(collection(db, 'notifications'), notificationData);
            }

            setShowModal(false);
            resetForm();
            fetchNotices();
        } catch (err) {
            console.error("Error saving notice:", err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this notice?")) {
            await deleteDoc(doc(db, 'notices', id));
            fetchNotices();
        }
    };

    const getClassName = (id) => {
        const cls = classes.find(c => c.id === id);
        return cls ? `${cls.branch} - ${cls.section}` : 'Unknown Class';
    };

    if (loading) return <div className="loading"><div className="spinner"></div>Loading notices...</div>;

    return (
        <div className="notices-management">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Notice Board & Circulars</h1>
                    <p className="page-description">Create and manage notices for students and staff.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={16} />
                    New Notice
                </button>
            </div>

            <div className="notices-grid">
                {notices.length === 0 ? (
                    <div className="empty-state">
                        <Megaphone size={40} />
                        <p>No notices posted yet.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Notice</th>
                                    <th>Target</th>
                                    <th>Posted By</th>
                                    <th>Date</th>
                                    <th style={{ width: '100px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notices.map((notice, index) => (
                                    <tr key={notice.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-slide-up">
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className={`notice-type-icon ${notice.type || 'info'}`}>
                                                    {notice.type === 'urgent' ? <AlertCircle size={16} /> : <Megaphone size={16} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{notice.title}</div>
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                        {notice.content.substring(0, 60)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {notice.target_type === 'college' ? (
                                                <span className="badge badge-secondary"><Users size={12} style={{ marginRight: 4 }} /> Entire College</span>
                                            ) : (
                                                <span className="badge badge-primary"><GraduationCap size={12} style={{ marginRight: 4 }} /> {getClassName(notice.target_class_id)}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>{notice.author_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{notice.author_role}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Clock size={12} />
                                                {notice.created_at?.toDate().toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openModal(notice)}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(notice.id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingNotice ? 'Edit Notice' : 'Post New Notice'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        placeholder="e.g. Holiday Announcement"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="info">Information</option>
                                        <option value="warning">Warning</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Content</label>
                                    <textarea
                                        className="form-textarea"
                                        required
                                        rows={5}
                                        placeholder="Enter notice details..."
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Target Range</label>
                                        <select
                                            className="form-select"
                                            value={formData.target_type}
                                            onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                                        >
                                            <option value="college">Entire College</option>
                                            <option value="class">Single Class</option>
                                        </select>
                                    </div>
                                    {formData.target_type === 'class' && (
                                        <div className="form-group">
                                            <label className="form-label">Select Class</label>
                                            <select
                                                className="form-select"
                                                required
                                                value={formData.target_class_id}
                                                onChange={(e) => setFormData({ ...formData, target_class_id: e.target.value })}
                                            >
                                                <option value="">Select Class</option>
                                                {classes.map(cls => (
                                                    <option key={cls.id} value={cls.id}>
                                                        {cls.branch} - {cls.section} ({cls.year} Year)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingNotice ? 'Update Notice' : 'Post Notice'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotices;
