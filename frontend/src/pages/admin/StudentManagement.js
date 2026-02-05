import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Edit2, X, Search, Upload, Download, Loader2, User, ChevronRight } from 'lucide-react';

const StudentManagement = () => {
    const { userData } = useAuth();
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [formData, setFormData] = useState({
        pin: '',
        name: '',
        email: '',
        password: '',
        class_id: ''
    });

    const fetchData = async () => {
        if (!userData?.college_id) return;
        setLoading(true);
        try {
            // Fetch classes first
            const classesQuery = query(collection(db, 'classes'), where('college_id', '==', userData.college_id));
            const classesSnapshot = await getDocs(classesQuery);
            const classesList = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(classesList);

            // Fetch students
            const studentsQuery = query(collection(db, 'students'), where('college_id', '==', userData.college_id));
            const studentsSnapshot = await getDocs(studentsQuery);
            const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(studentsList);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userData]);

    const resetForm = () => {
        setFormData({
            pin: '',
            name: '',
            email: '',
            password: '',
            class_id: ''
        });
        setEditingStudent(null);
    };

    const validatePIN = (pin, classId) => {
        const cls = classes.find(c => c.id === classId);
        if (!cls) return true;

        const rule = cls.pin_validation_rule;
        if (rule.type === 'regex') {
            const regex = new RegExp(rule.pattern);
            return regex.test(pin);
        } else {
            const num = parseInt(pin);
            return num >= rule.min && num <= rule.max;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validatePIN(formData.pin, formData.class_id)) {
            alert(`Invalid PIN for the selected class. Rule: ${classes.find(c => c.id === formData.class_id).pin_validation_rule.type === 'regex' ? 'Pattern' : 'Range'}`);
            return;
        }

        try {
            const studentData = {
                college_id: userData.college_id,
                pin: formData.pin,
                name: formData.name,
                email: formData.email,
                class_id: formData.class_id,
                role: 'student',
                status: 'active',
                must_change_password: true
            };

            if (editingStudent) {
                await updateDoc(doc(db, 'students', editingStudent.id), studentData);
            } else {
                if (!formData.password) {
                    alert('Password is required for new students');
                    return;
                }
                studentData.password = formData.password;

                // Check if PIN exists
                const q = query(collection(db, 'students'), where('college_id', '==', userData.college_id), where('pin', '==', formData.pin));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    alert('This PIN is already registered in your college.');
                    return;
                }

                await addDoc(collection(db, 'students'), {
                    ...studentData,
                    created_at: new Date()
                });
            }

            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error("Error saving student:", err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            await deleteDoc(doc(db, 'students', id));
            fetchData();
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const batch = writeBatch(db);
            let count = 0;

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length < headers.length) continue;

                const student = {};
                headers.forEach((header, idx) => student[header] = values[idx]);

                // Basic mapping
                const sData = {
                    college_id: userData.college_id,
                    pin: student.pin,
                    name: student.name,
                    email: student.email,
                    class_id: selectedClass === 'all' ? student.class_id : selectedClass,
                    role: 'student',
                    status: 'active',
                    password: student.pin.toString(), // Default password is the PIN
                    must_change_password: true,
                    created_at: new Date()
                };

                if (sData.pin && sData.name && sData.email && sData.class_id) {
                    const newDocRef = doc(collection(db, 'students'));
                    batch.set(newDocRef, sData);
                    count++;
                }
            }

            if (count > 0) {
                await batch.commit();
                alert(`Successfully imported ${count} students.`);
                fetchData();
            }
        };
        reader.readAsText(file);
    };

    const getClassName = (id) => {
        const cls = classes.find(c => c.id === id);
        return cls ? `${cls.branch} - Sec ${cls.section}` : 'Unknown';
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.pin.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = selectedClass === 'all' || s.class_id === selectedClass;
        return matchesSearch && matchesClass;
    }).sort((a, b) => a.pin.localeCompare(b.pin, undefined, { numeric: true }));

    if (loading) return <div className="loading">Loading students...</div>;

    return (
        <div className="student-management">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Student Management</h1>
                    <p className="page-description">Manage student records and admissions.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        <Upload size={16} /> Import CSV
                        <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        <Plus size={16} /> New Student
                    </button>
                </div>
            </div>

            <div className="filters card">
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="filter-group" style={{ flex: 1, minWidth: '250px' }}>
                        <Search size={16} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search name or PIN..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <select
                            className="form-select"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="all">All Classes</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.branch} - Sec {cls.section} (Year {cls.year})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>PIN</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(student => (
                            <tr key={student.id}>
                                <td><code style={{ fontWeight: 600 }}>{student.pin}</code></td>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{student.name}</td>
                                <td>{getClassName(student.class_id)}</td>
                                <td>{student.email}</td>
                                <td><span className={`badge badge-${student.status === 'active' ? 'success' : 'secondary'}`}>{student.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => {
                                            setEditingStudent(student);
                                            setFormData({
                                                pin: student.pin,
                                                name: student.name,
                                                email: student.email,
                                                class_id: student.class_id,
                                                password: ''
                                            });
                                            setShowModal(true);
                                        }}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(student.id)}>
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
                            <h3 className="modal-title">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">PIN (As per class rule)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        value={formData.pin}
                                        onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                        placeholder="Enter PIN"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
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
                                                {cls.branch} - Sec {cls.section}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                {!editingStudent && (
                                    <div className="form-group">
                                        <label className="form-label">Password</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Student</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManagement;
