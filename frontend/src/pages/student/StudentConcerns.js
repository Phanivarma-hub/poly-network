import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { AlertCircle, Send, Loader2, CheckCircle } from 'lucide-react';

const StudentConcerns = () => {
    const { userData } = useAuth();
    const [concerns, setConcerns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        category: 'academic',
        reported_pin: '',
        description: '',
        anonymous: false
    });

    const categories = ['academic', 'bullying', 'infrastructure', 'other'];

    useEffect(() => {
        const fetchConcerns = async () => {
            if (!userData?.college_id || !userData?.pin) return;

            try {
                // Fetch concerns reported by this student
                const concernsQuery = query(
                    collection(db, 'concerns'),
                    where('college_id', '==', userData.college_id),
                    where('reporter_pin', '==', userData.pin)
                );
                const snapshot = await getDocs(concernsQuery);
                setConcerns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error('Error fetching concerns:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConcerns();
    }, [userData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await addDoc(collection(db, 'concerns'), {
                college_id: userData.college_id,
                class_id: userData.class_id,
                reporter_pin: userData.pin,
                anonymous: formData.anonymous,
                category: formData.category,
                reported_pin: formData.reported_pin,
                description: formData.description,
                status: 'open',
                created_at: new Date()
            });

            setSubmitted(true);
            setFormData({
                category: 'academic',
                reported_pin: '',
                description: '',
                anonymous: false
            });

            setTimeout(() => {
                setShowForm(false);
                setSubmitted(false);
            }, 2000);
        } catch (error) {
            console.error('Error submitting concern:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'open': return <span className="badge badge-warning">Open</span>;
            case 'resolved': return <span className="badge badge-success">Resolved</span>;
            case 'escalated': return <span className="badge badge-danger">Escalated</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div>Loading...</div>;
    }

    if (submitted) {
        return (
            <div className="card" style={{ textAlign: 'center', maxWidth: '400px', margin: '2rem auto' }}>
                <CheckCircle size={48} style={{ color: 'var(--accent-success)', marginBottom: '1rem' }} />
                <h3>Concern Submitted!</h3>
                <p style={{ color: 'var(--text-muted)' }}>Your concern has been reported and will be reviewed by the administration.</p>
            </div>
        );
    }

    return (
        <div className="concerns-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Report a Concern</h1>
                    <p className="page-description">Report issues or concerns anonymously or with your identity.</p>
                </div>
                {!showForm && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <AlertCircle size={16} /> Report Concern
                    </button>
                )}
            </div>

            {showForm ? (
                <div className="card" style={{ maxWidth: '600px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Submit a Concern</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                                className="form-select"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Reported Student PIN (optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="If reporting about a specific student"
                                value={formData.reported_pin}
                                onChange={(e) => setFormData({ ...formData, reported_pin: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-textarea"
                                required
                                rows={4}
                                placeholder="Describe your concern in detail..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="checkbox-group">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={formData.anonymous}
                                    onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                                />
                                <span>Submit anonymously</span>
                            </label>
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                                Your identity will be hidden from administrators if checked
                            </small>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 size={16} className="spinner" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Submit
                                    </>
                                )}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    {concerns.length === 0 ? (
                        <div className="empty-state">
                            <AlertCircle size={40} />
                            <p>No concerns reported yet.</p>
                        </div>
                    ) : (
                        <div>
                            <h3 style={{ marginBottom: '1rem' }}>My Reported Concerns</h3>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Category</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {concerns.map(concern => (
                                            <tr key={concern.id}>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                                                    {formatDate(concern.created_at)}
                                                </td>
                                                <td><span className="badge badge-primary">{concern.category}</span></td>
                                                <td>{getStatusBadge(concern.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentConcerns;
