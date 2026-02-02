import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Edit2, X, Search, BookOpen } from 'lucide-react';

const SubjectManagement = () => {
    const { userData } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'theory' // theory, lab, elective
    });

    const fetchSubjects = async () => {
        if (!userData?.college_id) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'subjects'), where('college_id', '==', userData.college_id));
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubjects(list);
        } catch (err) {
            console.error("Error fetching subjects:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, [userData]);

    const resetForm = () => {
        setFormData({ name: '', code: '', type: 'theory' });
        setEditingSubject(null);
    };

    const openModal = (sub = null) => {
        if (sub) {
            setEditingSubject(sub);
            setFormData({
                name: sub.name,
                code: sub.code,
                type: sub.type || 'theory'
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                college_id: userData.college_id,
                name: formData.name,
                code: formData.code.toUpperCase(),
                type: formData.type
            };

            if (editingSubject) {
                await updateDoc(doc(db, 'subjects', editingSubject.id), data);
            } else {
                await addDoc(collection(db, 'subjects'), data);
            }

            setShowModal(false);
            resetForm();
            fetchSubjects();
        } catch (err) {
            console.error("Error saving subject:", err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure? This might affect existing timetables.")) {
            await deleteDoc(doc(db, 'subjects', id));
            fetchSubjects();
        }
    };

    const filtered = subjects.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading">Loading subjects...</div>;

    return (
        <div className="teacher-management">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Subject Management</h1>
                    <p className="page-description">Define subjects for your college.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={16} /> New Subject
                </button>
            </div>

            <div className="filters">
                <div className="filter-group" style={{ flex: 1, maxWidth: '300px' }}>
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search subjects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th style={{ width: '100px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(sub => (
                            <tr key={sub.id}>
                                <td><code style={{ color: 'var(--accent-primary)' }}>{sub.code}</code></td>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{sub.name}</td>
                                <td>
                                    <span className={`badge badge-${sub.type === 'lab' ? 'success' : sub.type === 'elective' ? 'warning' : 'primary'}`}>
                                        {sub.type}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openModal(sub)}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(sub.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">{editingSubject ? 'Edit Subject' : 'Create Subject'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Subject Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        placeholder="e.g. Data Structures"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subject Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        placeholder="e.g. CS101"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="theory">Theory</option>
                                        <option value="lab">Lab</option>
                                        <option value="elective">Elective</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Subject</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectManagement;
