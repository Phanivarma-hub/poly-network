import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Edit2, X, Search, UserCheck } from 'lucide-react';

const TeacherManagement = () => {
    const { userData } = useAuth();
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        uid: '',
        name: '',
        email: '',
        is_class_teacher: false,
        class_id_assigned: '',
        subjects: ''
    });

    const fetchData = async () => {
        if (!userData?.college_id) return;
        setLoading(true);
        try {
            // Fetch teachers
            const teachersQuery = query(collection(db, 'teachers'), where('college_id', '==', userData.college_id));
            const teachersSnapshot = await getDocs(teachersQuery);
            const teachersList = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTeachers(teachersList);

            // Fetch classes for dropdown
            const classesQuery = query(collection(db, 'classes'), where('college_id', '==', userData.college_id));
            const classesSnapshot = await getDocs(classesQuery);
            const classesList = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(classesList);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userData]);

    const generateUID = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let uid = '';
        for (let i = 0; i < 3; i++) {
            uid += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return uid;
    };

    const resetForm = () => {
        setFormData({
            uid: generateUID(),
            name: '',
            email: '',
            is_class_teacher: false,
            class_id_assigned: '',
            subjects: ''
        });
        setEditingTeacher(null);
    };

    const openModal = (teacher = null) => {
        if (teacher) {
            setEditingTeacher(teacher);
            setFormData({
                uid: teacher.uid,
                name: teacher.name,
                email: teacher.email,
                is_class_teacher: teacher.is_class_teacher || false,
                class_id_assigned: teacher.class_id_assigned || '',
                subjects: Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : ''
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const teacherData = {
                college_id: userData.college_id,
                uid: formData.uid,
                name: formData.name,
                email: formData.email,
                role: 'teacher',
                is_class_teacher: formData.is_class_teacher,
                class_id_assigned: formData.is_class_teacher ? formData.class_id_assigned : null,
                subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s)
            };

            if (editingTeacher) {
                await updateDoc(doc(db, 'teachers', editingTeacher.id), teacherData);
            } else {
                await addDoc(collection(db, 'teachers'), teacherData);
            }

            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error("Error saving teacher:", err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this teacher?")) {
            await deleteDoc(doc(db, 'teachers', id));
            fetchData();
        }
    };

    const getClassName = (classId) => {
        const cls = classes.find(c => c.id === classId);
        return cls ? `${cls.branch} - ${cls.section}` : '-';
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.uid.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                Loading teachers...
            </div>
        );
    }

    return (
        <div className="teacher-management">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Teacher Management</h1>
                    <p className="page-description">Manage teachers and their class assignments.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={16} />
                    New Teacher
                </button>
            </div>

            <div className="filters">
                <div className="filter-group" style={{ flex: 1, maxWidth: '300px' }}>
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by name or UID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filteredTeachers.length === 0 ? (
                <div className="empty-state">
                    <p>No teachers found. Add your first teacher to get started.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>UID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Class Teacher</th>
                                <th>Subjects</th>
                                <th style={{ width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTeachers.map(teacher => (
                                <tr key={teacher.id}>
                                    <td><code style={{ color: 'var(--accent-primary)' }}>{teacher.uid}</code></td>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{teacher.name}</td>
                                    <td>{teacher.email}</td>
                                    <td>
                                        {teacher.is_class_teacher ? (
                                            <span className="badge badge-success">
                                                <UserCheck size={12} style={{ marginRight: '4px' }} />
                                                {getClassName(teacher.class_id_assigned)}
                                            </span>
                                        ) : (
                                            <span className="badge badge-secondary" style={{ opacity: 0.5 }}>No</span>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                            {Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openModal(teacher)}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(teacher.id)}>
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
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">{editingTeacher ? 'Edit Teacher' : 'Create New Teacher'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Teacher UID (3 letters)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            required
                                            maxLength={3}
                                            placeholder="e.g. ABC"
                                            value={formData.uid}
                                            onChange={(e) => setFormData({ ...formData, uid: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            required
                                            placeholder="Full Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        required
                                        placeholder="teacher@college.edu"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Subjects (comma separated)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Mathematics, Physics"
                                        value={formData.subjects}
                                        onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={formData.is_class_teacher}
                                            onChange={(e) => setFormData({ ...formData, is_class_teacher: e.target.checked })}
                                        />
                                        <span>Assign as Class Teacher</span>
                                    </label>
                                </div>

                                {formData.is_class_teacher && (
                                    <div className="form-group">
                                        <label className="form-label">Assigned Class</label>
                                        <select
                                            className="form-select"
                                            required={formData.is_class_teacher}
                                            value={formData.class_id_assigned}
                                            onChange={(e) => setFormData({ ...formData, class_id_assigned: e.target.value })}
                                        >
                                            <option value="">Select a class</option>
                                            {classes.map(cls => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.branch} - Sec {cls.section} (Year {cls.year}, Sem {cls.semester})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingTeacher ? 'Update Teacher' : 'Create Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherManagement;
