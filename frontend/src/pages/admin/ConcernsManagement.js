import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, X, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const ConcernsManagement = () => {
    const { userData } = useAuth();
    const [concerns, setConcerns] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConcern, setSelectedConcern] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            if (!userData?.college_id) return;

            try {
                // Fetch concerns
                const concernsQuery = query(
                    collection(db, 'concerns'),
                    where('college_id', '==', userData.college_id)
                );
                const concernsSnapshot = await getDocs(concernsQuery);
                const concernsList = concernsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setConcerns(concernsList.sort((a, b) =>
                    (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0)
                ));

                // Fetch classes
                const classesQuery = query(collection(db, 'classes'), where('college_id', '==', userData.college_id));
                const classesSnapshot = await getDocs(classesQuery);
                const classesList = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClasses(classesList);
            } catch (err) {
                console.error("Error fetching concerns:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userData]);

    const getClassName = (classId) => {
        const cls = classes.find(c => c.id === classId);
        return cls ? `${cls.branch} - ${cls.section}` : '-';
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'open':
                return <span className="badge badge-warning"><Clock size={12} style={{ marginRight: '4px' }} />Open</span>;
            case 'resolved':
                return <span className="badge badge-success"><CheckCircle size={12} style={{ marginRight: '4px' }} />Resolved</span>;
            case 'escalated':
                return <span className="badge badge-danger"><AlertTriangle size={12} style={{ marginRight: '4px' }} />Escalated</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    const handleStatusUpdate = async (concernId, newStatus) => {
        try {
            await updateDoc(doc(db, 'concerns', concernId), {
                status: newStatus,
                resolved_at: newStatus === 'resolved' ? new Date() : null
            });

            setConcerns(prev => prev.map(c =>
                c.id === concernId ? { ...c, status: newStatus } : c
            ));
            setSelectedConcern(null);
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };

    const filteredConcerns = concerns.filter(c =>
        filterStatus === 'all' || c.status === filterStatus
    );

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                Loading concerns...
            </div>
        );
    }

    return (
        <div className="concerns-management">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Concerns Management</h1>
                    <p className="page-description">Review and respond to student concerns.</p>
                </div>
            </div>

            <div className="filters" style={{ marginBottom: '1rem' }}>
                <div className="filter-group">
                    <span className="filter-label">Status:</span>
                    {['all', 'open', 'resolved', 'escalated'].map(status => (
                        <button
                            key={status}
                            className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilterStatus(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {filteredConcerns.length === 0 ? (
                <div className="empty-state">
                    <AlertCircle size={40} />
                    <p>No concerns found.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Class</th>
                                <th>Category</th>
                                <th>Reported Student</th>
                                <th>Anonymous</th>
                                <th>Status</th>
                                <th style={{ width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredConcerns.map(concern => (
                                <tr key={concern.id}>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                                        {formatDate(concern.created_at)}
                                    </td>
                                    <td>{getClassName(concern.class_id)}</td>
                                    <td><span className="badge badge-primary">{concern.category}</span></td>
                                    <td><code style={{ color: 'var(--accent-primary)' }}>{concern.reported_pin}</code></td>
                                    <td>{concern.anonymous ? 'Yes' : 'No'}</td>
                                    <td>{getStatusBadge(concern.status)}</td>
                                    <td>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setSelectedConcern(concern)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail Modal */}
            {selectedConcern && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Concern Details</h3>
                            <button className="modal-close" onClick={() => setSelectedConcern(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Class</div>
                                    <div style={{ fontWeight: 500 }}>{getClassName(selectedConcern.class_id)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Category</div>
                                    <div><span className="badge badge-primary">{selectedConcern.category}</span></div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Reporter</div>
                                    <div>{selectedConcern.anonymous ? 'Anonymous' : <code>{selectedConcern.reporter_pin}</code>}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Reported Student</div>
                                    <div><code>{selectedConcern.reported_pin}</code></div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Description</div>
                                <div style={{
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--bg-primary)',
                                    borderRadius: 'var(--border-radius)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    {selectedConcern.description}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Current Status</div>
                                {getStatusBadge(selectedConcern.status)}
                            </div>
                        </div>
                        <div className="modal-footer">
                            {selectedConcern.status !== 'resolved' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleStatusUpdate(selectedConcern.id, 'resolved')}
                                >
                                    <CheckCircle size={14} />
                                    Mark Resolved
                                </button>
                            )}
                            {selectedConcern.status === 'open' && (
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleStatusUpdate(selectedConcern.id, 'escalated')}
                                >
                                    <AlertTriangle size={14} />
                                    Escalate
                                </button>
                            )}
                            <button className="btn btn-secondary" onClick={() => setSelectedConcern(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConcernsManagement;
