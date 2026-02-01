import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, X, Play, Square, FileText } from 'lucide-react';

const TeacherQuizzes = () => {
    const { userData } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        class_id: '',
        subject: '',
        status: 'draft'
    });

    const fetchData = async () => {
        if (!userData?.college_id) return;

        try {
            // Fetch quizzes created by this teacher
            const quizzesQuery = query(
                collection(db, 'quizzes'),
                where('college_id', '==', userData.college_id),
                where('created_by', '==', userData.uid)
            );
            const quizzesSnapshot = await getDocs(quizzesQuery);
            const quizzesList = quizzesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setQuizzes(quizzesList);

            // Fetch classes
            const classesQuery = query(
                collection(db, 'classes'),
                where('college_id', '==', userData.college_id)
            );
            const classesSnapshot = await getDocs(classesQuery);
            setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userData]);

    const fetchQuestions = async (quizId) => {
        const questionsQuery = query(
            collection(db, 'quiz_questions'),
            where('quiz_id', '==', quizId)
        );
        const snapshot = await getDocs(questionsQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const openModal = async (quiz = null) => {
        if (quiz) {
            setEditingQuiz(quiz);
            setFormData({
                title: quiz.title,
                class_id: quiz.class_id,
                subject: quiz.subject,
                status: quiz.status
            });
            const qs = await fetchQuestions(quiz.id);
            setQuestions(qs);
        } else {
            setEditingQuiz(null);
            setFormData({
                title: '',
                class_id: '',
                subject: '',
                status: 'draft'
            });
            setQuestions([]);
        }
        setShowModal(true);
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            question: '',
            options: ['', '', '', ''],
            correct_answer: 0
        }]);
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...questions];
        if (field === 'options') {
            updated[index].options = value;
        } else {
            updated[index][field] = value;
        }
        setQuestions(updated);
    };

    const removeQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const quizData = {
                college_id: userData.college_id,
                class_id: formData.class_id,
                title: formData.title,
                subject: formData.subject,
                status: formData.status,
                created_by: userData.uid,
                created_at: new Date()
            };

            let quizId;
            if (editingQuiz) {
                await updateDoc(doc(db, 'quizzes', editingQuiz.id), quizData);
                quizId = editingQuiz.id;

                // Delete old questions
                const oldQuestions = await fetchQuestions(quizId);
                for (const q of oldQuestions) {
                    await deleteDoc(doc(db, 'quiz_questions', q.id));
                }
            } else {
                const docRef = await addDoc(collection(db, 'quizzes'), quizData);
                quizId = docRef.id;
            }

            // Add questions
            for (const q of questions) {
                await addDoc(collection(db, 'quiz_questions'), {
                    quiz_id: quizId,
                    question: q.question,
                    options: q.options,
                    correct_answer: q.correct_answer
                });
            }

            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving quiz:', error);
        }
    };

    const handleDelete = async (quizId) => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) return;

        try {
            // Delete questions first
            const questions = await fetchQuestions(quizId);
            for (const q of questions) {
                await deleteDoc(doc(db, 'quiz_questions', q.id));
            }
            await deleteDoc(doc(db, 'quizzes', quizId));
            fetchData();
        } catch (error) {
            console.error('Error deleting quiz:', error);
        }
    };

    const toggleStatus = async (quiz) => {
        const newStatus = quiz.status === 'draft' ? 'active' : quiz.status === 'active' ? 'ended' : 'draft';
        await updateDoc(doc(db, 'quizzes', quiz.id), { status: newStatus });
        fetchData();
    };

    const getClassName = (classId) => {
        const cls = classes.find(c => c.id === classId);
        return cls ? `${cls.branch} - ${cls.section}` : '-';
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'draft': return <span className="badge badge-secondary">Draft</span>;
            case 'active': return <span className="badge badge-success">Active</span>;
            case 'ended': return <span className="badge badge-danger">Ended</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div>Loading...</div>;
    }

    return (
        <div className="quizzes-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Quizzes</h1>
                    <p className="page-description">Create and manage MCQ quizzes for your classes.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={16} /> Create Quiz
                </button>
            </div>

            {quizzes.length === 0 ? (
                <div className="empty-state">
                    <FileText size={40} />
                    <p>No quizzes yet. Create your first quiz to get started.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Class</th>
                                <th>Subject</th>
                                <th>Status</th>
                                <th style={{ width: '150px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quizzes.map(quiz => (
                                <tr key={quiz.id}>
                                    <td style={{ fontWeight: 500 }}>{quiz.title}</td>
                                    <td>{getClassName(quiz.class_id)}</td>
                                    <td>{quiz.subject}</td>
                                    <td>{getStatusBadge(quiz.status)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => toggleStatus(quiz)} title="Toggle Status">
                                                {quiz.status === 'active' ? <Square size={14} /> : <Play size={14} />}
                                            </button>
                                            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openModal(quiz)}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(quiz.id)}>
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

            {/* Quiz Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingQuiz ? 'Edit Quiz' : 'Create Quiz'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Quiz Title</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            required
                                            placeholder="e.g. Chapter 1 Test"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Subject</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. Mathematics"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Target Class</label>
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

                                <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4>Questions</h4>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={addQuestion}>
                                        <Plus size={14} /> Add Question
                                    </button>
                                </div>

                                {questions.map((q, idx) => (
                                    <div key={idx} style={{
                                        padding: '1rem',
                                        backgroundColor: 'var(--bg-primary)',
                                        borderRadius: 'var(--border-radius)',
                                        marginBottom: '0.75rem',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Question {idx + 1}</span>
                                            <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeQuestion(idx)}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Enter question"
                                            value={q.question}
                                            onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                                            style={{ marginBottom: '0.5rem' }}
                                        />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            {q.options.map((opt, optIdx) => (
                                                <div key={optIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <input
                                                        type="radio"
                                                        name={`correct_${idx}`}
                                                        checked={q.correct_answer === optIdx}
                                                        onChange={() => updateQuestion(idx, 'correct_answer', optIdx)}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder={`Option ${optIdx + 1}`}
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOptions = [...q.options];
                                                            newOptions[optIdx] = e.target.value;
                                                            updateQuestion(idx, 'options', newOptions);
                                                        }}
                                                        style={{ flex: 1 }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingQuiz ? 'Update' : 'Create'} Quiz</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherQuizzes;
