import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Edit2, X, Search, FileText } from 'lucide-react';

const AssignmentManagement = () => {
    const { userData } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject_id: '',
        total_marks: 10
    });

    const fetchData = async () => {
        if (!userData?.college_id) return;
        setLoading(true);
        try {
            const subQ = query(collection(db, 'subjects'), where('college_id', '==', userData.college_id));
            const subSnapshot = await getDocs(subQ);
            const subList = subSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubjects(subList);

            const assQ = query(collection(db, 'assignments'), where('college_id', '==', userData.college_id));
            const assSnapshot = await getDocs(assQ);
            const assList = assSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAssignments(assList);
        } catch (err) {
            console.error("Error fetching assignments:", err);
        } finally {
            setLoading(true); // Wait, loading should be false
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userData]);

    const resetForm = () => {
        setFormData({ title: '', description: '', subject_id: '', total_marks: 10 });
        setEditingAssignment(null);
    };

    const openModal = (ass = null) => {
        if (ass) {
            setEditingAssignment(ass);
            setFormData({
                title: ass.title,
                description: ass.description,
                subject_id: ass.subject_id,
                total_marks: ass.total_marks
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
                title: formData.title,
                description: formData.description,
                subject_id: formData.subject_id,
                total_marks: parseInt(formData.total_marks) || 10,
                created_at: new Date()
            };

            if (editingAssignment) {
                await updateDoc(doc(db, 'assignments', editingAssignment.id), data);
            } else {
                await addDoc(collection(db, 'assignments'), data);
            }

            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error("Error saving assignment:", err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            await deleteDoc(doc(db, 'assignments', id));
            fetchData();
        }
    };

    const getSubjectName = (id) => {
        const sub = subjects.find(s => s.id === id);
        return sub ? sub.name : 'Unknown Subject';
    };

    const filtered = assignments.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getSubjectName(a.subject_id).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading">Loading assignments...</div>;

    return (
        <div className="teacher-management">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Assignment Repository</h1>
                    <p className="page-description">Create template assignments for teachers to use.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={16} /> New Assignment
                </button>
            </div>

            <div className="filters">
                <div className="filter-group" style={{ flex: 1, maxWidth: '300px' }}>
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search assignments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Subject</th>
                            <th>Marks</th>
                            <th style={{ width: '100px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(ass => (
                            <tr key={ass.id}>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{ass.title}</td>
                                <td>{getSubjectName(ass.subject_id)}</td>
                                <td><span className="badge badge-secondary">{ass.total_marks}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openModal(ass)}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(ass.id)}>
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
                            <h3 className="modal-title">{editingAssignment ? 'Edit Assignment' : 'Create Assignment Template'}</h3>
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
                                        placeholder="e.g. Assignment 1"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subject</label>
                                    <select
                                        className="form-select"
                                        required
                                        value={formData.subject_id}
                                        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        rows="3"
                                        placeholder="Describe the assignment..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Total Marks</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        value={formData.total_marks}
                                        onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Template</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentManagement;
