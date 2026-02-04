import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Edit2, X, Loader2, Search, BookOpen } from 'lucide-react';

const ClassManagement = () => {
    const { userData } = useAuth();
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        branch: '',
        year: '1',
        semester: '1',
        section: 'A',
        subject_sessions: {},
        pinMin: '',
        pinMax: ''
    });

    const yearOptions = [
        { value: '1', label: 'First Year' },
        { value: '2', label: 'Second Year' },
        { value: '3', label: 'Third Year' },
        { value: '4', label: 'Fourth Year' }
    ];

    const fetchClasses = async () => {
        if (!userData?.college_id) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'classes'), where('college_id', '==', userData.college_id));
            const snapshot = await getDocs(q);
            const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(classList);
        } catch (err) {
            console.error("Error fetching classes:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        if (!userData?.college_id) return;
        try {
            const q = query(collection(db, 'subjects'), where('college_id', '==', userData.college_id));
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubjects(list);
        } catch (err) {
            console.error("Error fetching subjects:", err);
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchSubjects();
    }, [userData]);

    const resetForm = () => {
        setFormData({
            branch: '',
            year: '1',
            semester: '1',
            section: 'A',
            subject_sessions: {},
            pinMin: '',
            pinMax: ''
        });
        setEditingClass(null);
    };

    const openModal = (cls = null) => {
        if (cls) {
            setEditingClass(cls);
            setFormData({
                branch: cls.branch,
                year: cls.year,
                semester: cls.semester,
                section: cls.section,
                subject_sessions: cls.subject_sessions || {},
                pinMin: cls.pin_validation_rule?.min || '',
                pinMax: cls.pin_validation_rule?.max || ''
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSessionChange = (subjectId, sessions) => {
        setFormData({
            ...formData,
            subject_sessions: {
                ...formData.subject_sessions,
                [subjectId]: parseInt(sessions) || 0
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const classData = {
                college_id: userData.college_id,
                branch: formData.branch,
                year: formData.year,
                semester: formData.semester,
                section: formData.section,
                subject_sessions: formData.subject_sessions,
                pin_validation_rule: {
                    type: 'range',
                    min: parseInt(formData.pinMin),
                    max: parseInt(formData.pinMax)
                }
            };

            if (editingClass) {
                await updateDoc(doc(db, 'classes', editingClass.id), classData);
            } else {
                await addDoc(collection(db, 'classes'), { ...classData, status: 'active' });
            }

            setShowModal(false);
            resetForm();
            fetchClasses();
        } catch (err) {
            console.error("Error saving class:", err);
        }
    };

    const handleDelete = async (id) => {
        // Check if students are assigned to this class
        const q = query(collection(db, 'students'), where('class_id', '==', id));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            alert("This class cannot be deleted because it has students assigned to it. Please disable it instead.");
            return;
        }

        if (window.confirm("Are you sure you want to delete this class?")) {
            await deleteDoc(doc(db, 'classes', id));
            fetchClasses();
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        await updateDoc(doc(db, 'classes', id), { status: newStatus });
        fetchClasses();
    };

    const filteredClasses = classes.filter(cls =>
        cls.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.section.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                Loading classes...
            </div>
        );
    }

    return (
        <div className="class-management">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Class Management</h1>
                    <p className="page-description">Manage academic units and subject sessions.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={16} />
                    New Class
                </button>
            </div>

            <div className="filters">
                <div className="filter-group" style={{ flex: 1, maxWidth: '300px' }}>
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by branch or section..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filteredClasses.length === 0 ? (
                <div className="empty-state">
                    <p>No classes found. Create your first class to get started.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Branch</th>
                                <th>Year</th>
                                <th>Semester</th>
                                <th>Section</th>
                                <th>Subjects Configured</th>
                                <th style={{ width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClasses.map(cls => (
                                <tr key={cls.id}>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{cls.branch}</td>
                                    <td>{yearOptions.find(y => y.value === cls.year)?.label || cls.year}</td>
                                    <td>{cls.semester}</td>
                                    <td><span className="badge badge-primary">{cls.section}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span className="badge badge-secondary">
                                                {Object.keys(cls.subject_sessions || {}).length} Subjects
                                            </span>
                                            {cls.pin_validation_rule && (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    PIN: {cls.pin_validation_rule.min} - {cls.pin_validation_rule.max}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className={`btn btn-icon btn-sm ${cls.status === 'inactive' ? 'btn-success' : 'btn-secondary'}`}
                                                onClick={() => handleToggleStatus(cls.id, cls.status || 'active')}
                                                title={cls.status === 'inactive' ? 'Activate' : 'Deactivate'}
                                            >
                                                <X size={14} style={{ transform: cls.status === 'inactive' ? 'rotate(45deg)' : 'none' }} />
                                            </button>
                                            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openModal(cls)}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(cls.id)}>
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

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingClass ? 'Edit Class' : 'Create New Class'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="form-group">
                                    <label className="form-label">Branch Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        placeholder="e.g. Computer Science"
                                        value={formData.branch}
                                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Year</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                        >
                                            {yearOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Semester</label>
                                        <select
                                            className="form-select"
                                            value={formData.semester}
                                            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Section</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        placeholder="e.g. A"
                                        value={formData.section}
                                        onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label className="form-label">PIN Range (Numeric)</label>
                                    <div className="form-row">
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Min PIN</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                required
                                                placeholder="e.g. 199"
                                                value={formData.pinMin}
                                                onChange={(e) => setFormData({ ...formData, pinMin: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Max PIN</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                required
                                                placeholder="e.g. 259"
                                                value={formData.pinMax}
                                                onChange={(e) => setFormData({ ...formData, pinMax: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="subjects-section" style={{ marginTop: '1.5rem' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <BookOpen size={18} />
                                        Subject Sessions (Classes per week)
                                    </label>

                                    {subjects.length === 0 ? (
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                            No subjects found. Please add subjects in Subject Management first.
                                        </p>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '0.75rem', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject</div>
                                            <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Sessions</div>

                                            {subjects.map(sub => (
                                                <React.Fragment key={sub.id}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 500 }}>{sub.name}</span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.code} • {sub.type}</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        min="0"
                                                        max="20"
                                                        placeholder="0"
                                                        value={formData.subject_sessions[sub.id] || ''}
                                                        onChange={(e) => handleSessionChange(sub.id, e.target.value)}
                                                        style={{ textAlign: 'center' }}
                                                    />
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingClass ? 'Update Class' : 'Create Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassManagement;
