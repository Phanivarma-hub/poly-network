import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, X, FileText, Download } from 'lucide-react';

const TeacherMaterials = () => {
    const { userData } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        class_id: '',
        subject: '',
        file_url: '',
        file_type: 'pdf'
    });

    const fetchData = async () => {
        if (!userData?.college_id) return;

        try {
            // Fetch materials uploaded by this teacher
            const materialsQuery = query(
                collection(db, 'materials'),
                where('college_id', '==', userData.college_id),
                where('uploaded_by', '==', userData.uid)
            );
            const materialsSnapshot = await getDocs(materialsQuery);
            setMaterials(materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch classes
            const classesQuery = query(
                collection(db, 'classes'),
                where('college_id', '==', userData.college_id)
            );
            const classesSnapshot = await getDocs(classesQuery);
            setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch subjects
            const subjectsQuery = query(
                collection(db, 'subjects'),
                where('college_id', '==', userData.college_id)
            );
            const subjectsSnapshot = await getDocs(subjectsQuery);
            setSubjects(subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userData]);

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            class_id: '',
            subject: '',
            file_url: '',
            file_type: 'pdf'
        });
        setEditingMaterial(null);
    };

    const openModal = (material = null) => {
        if (material) {
            setEditingMaterial(material);
            setFormData({
                title: material.title,
                description: material.description || '',
                class_id: material.class_id,
                subject: material.subject,
                file_url: material.file_url,
                file_type: material.file_type || 'pdf'
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const materialData = {
                college_id: userData.college_id,
                class_id: formData.class_id,
                title: formData.title,
                description: formData.description,
                subject: formData.subject,
                file_url: formData.file_url,
                file_type: formData.file_type,
                uploaded_by: userData.uid,
                created_at: new Date()
            };

            if (editingMaterial) {
                await updateDoc(doc(db, 'materials', editingMaterial.id), materialData);
            } else {
                await addDoc(collection(db, 'materials'), materialData);
            }

            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving material:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this material?')) {
            await deleteDoc(doc(db, 'materials', id));
            fetchData();
        }
    };

    const getClassName = (classId) => {
        const cls = classes.find(c => c.id === classId);
        return cls ? `${cls.branch} - ${cls.section}` : '-';
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div>Loading...</div>;
    }

    return (
        <div className="materials-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Study Materials</h1>
                    <p className="page-description">Upload and manage study materials for your classes.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={16} /> Upload Material
                </button>
            </div>

            {materials.length === 0 ? (
                <div className="empty-state">
                    <FileText size={40} />
                    <p>No materials uploaded yet. Upload your first material to get started.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Class</th>
                                <th>Subject</th>
                                <th>Type</th>
                                <th style={{ width: '150px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map(material => (
                                <tr key={material.id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{material.title}</div>
                                        {material.description && (
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                {material.description.substring(0, 50)}...
                                            </div>
                                        )}
                                    </td>
                                    <td>{getClassName(material.class_id)}</td>
                                    <td><span className="badge badge-primary">{material.subject}</span></td>
                                    <td><span className="badge badge-secondary">{material.file_type?.toUpperCase()}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {material.file_url && (
                                                <a href={material.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm btn-icon">
                                                    <Download size={14} />
                                                </a>
                                            )}
                                            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openModal(material)}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(material.id)}>
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
                            <h3 className="modal-title">{editingMaterial ? 'Edit Material' : 'Upload Material'}</h3>
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
                                        placeholder="e.g. Introduction to Arrays"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description (optional)</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Brief description of the material"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Class</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={formData.class_id}
                                            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map(cls => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.branch} - Section {cls.section}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Subject</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.map(s => (
                                                <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">File URL</label>
                                        <input
                                            type="url"
                                            className="form-input"
                                            required
                                            placeholder="https://..."
                                            value={formData.file_url}
                                            onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">File Type</label>
                                        <select
                                            className="form-select"
                                            value={formData.file_type}
                                            onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                                        >
                                            <option value="pdf">PDF</option>
                                            <option value="docx">DOCX</option>
                                            <option value="pptx">PPTX</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingMaterial ? 'Update' : 'Upload'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherMaterials;
