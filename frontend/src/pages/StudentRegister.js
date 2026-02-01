import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { GraduationCap, ArrowLeft, User, Lock, Phone, Loader2, CheckCircle } from 'lucide-react';
import '../styles/styles.css';

const StudentRegister = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [college, setCollege] = useState(null);
    const [classes, setClasses] = useState([]);
    const [generatedPin, setGeneratedPin] = useState('');

    const [formData, setFormData] = useState({
        collegeCode: '',
        class_id: '',
        name: '',
        password: '',
        confirmPassword: '',
        parent_phone: ''
    });

    // Verify college code
    const handleVerifyCollege = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const collegeQuery = query(
                collection(db, 'colleges'),
                where('code', '==', formData.collegeCode.toUpperCase())
            );
            const collegeSnapshot = await getDocs(collegeQuery);

            if (collegeSnapshot.empty) {
                setError('College not found. Please check the code.');
                setLoading(false);
                return;
            }

            const collegeDoc = collegeSnapshot.docs[0];
            setCollege({ id: collegeDoc.id, ...collegeDoc.data() });

            // Fetch classes for this college
            const classesQuery = query(
                collection(db, 'classes'),
                where('college_id', '==', collegeDoc.id)
            );
            const classesSnapshot = await getDocs(classesQuery);
            setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            setStep(2);
        } catch (err) {
            setError('Error verifying college. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Generate PIN based on class rules
    const generatePIN = async (classDoc) => {
        const pinValidation = classDoc.pin_validation;

        if (pinValidation?.type === 'range' && pinValidation?.start && pinValidation?.end) {
            // Get existing students in this class
            const studentsQuery = query(
                collection(db, 'students'),
                where('class_id', '==', classDoc.id)
            );
            const studentsSnapshot = await getDocs(studentsQuery);
            const existingPins = studentsSnapshot.docs.map(d => parseInt(d.data().pin) || 0);

            // Find next available PIN in range
            for (let pin = parseInt(pinValidation.start); pin <= parseInt(pinValidation.end); pin++) {
                if (!existingPins.includes(pin)) {
                    return pin.toString();
                }
            }
            throw new Error('No available PINs in this class range.');
        } else {
            // Generate random 6-digit PIN
            const pin = Math.floor(100000 + Math.random() * 900000).toString();
            return pin;
        }
    };

    // Submit registration
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        try {
            const selectedClass = classes.find(c => c.id === formData.class_id);
            if (!selectedClass) {
                setError('Please select a class.');
                setLoading(false);
                return;
            }

            const pin = await generatePIN(selectedClass);

            await addDoc(collection(db, 'students'), {
                college_id: college.id,
                class_id: formData.class_id,
                pin: pin,
                name: formData.name,
                password: formData.password,
                parent_phone: formData.parent_phone,
                role: 'student',
                created_at: new Date()
            });

            setGeneratedPin(pin);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Error creating account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        <CheckCircle size={32} style={{ color: 'var(--accent-success)' }} />
                    </div>
                    <h2>Registration Successful!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Your account has been created. Please save your PIN.
                    </p>
                    <div style={{
                        backgroundColor: 'var(--bg-primary)',
                        padding: '1.5rem',
                        borderRadius: 'var(--border-radius)',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            Your Student PIN
                        </div>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: 'var(--accent-primary)',
                            letterSpacing: '0.2em'
                        }}>
                            {generatedPin}
                        </div>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        ⚠️ Save this PIN! You'll need it to login.
                    </p>
                    <button className="btn btn-primary btn-full" onClick={() => navigate('/login')}>
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <Link to="/login" className="back-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <div className="login-header">
                    <div className="login-logo" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                        <GraduationCap size={32} />
                    </div>
                    <h1>Student Registration</h1>
                    <p>Create your student account</p>
                </div>

                {/* Progress indicator */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '2px',
                        backgroundColor: step >= 1 ? 'var(--accent-success)' : 'var(--border-color)'
                    }}></div>
                    <div style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '2px',
                        backgroundColor: step >= 2 ? 'var(--accent-success)' : 'var(--border-color)'
                    }}></div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {step === 1 && (
                    <form onSubmit={handleVerifyCollege}>
                        <div className="form-group">
                            <label className="form-label">College Code</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter your college code (e.g. DEMO)"
                                required
                                value={formData.collegeCode}
                                onChange={(e) => setFormData({ ...formData, collegeCode: e.target.value.toUpperCase() })}
                            />
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                Get this code from your college administrator
                            </small>
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? <><Loader2 size={18} className="spinner" /> Verifying...</> : 'Continue'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--border-radius)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-success)' }}>College</div>
                            <div style={{ fontWeight: 600 }}>{college?.name}</div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Select Class</label>
                            <select
                                className="form-select"
                                required
                                value={formData.class_id}
                                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                            >
                                <option value="">Choose your class</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.branch} - Section {cls.section}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                required
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Parent Phone (optional)</label>
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="10-digit phone number"
                                value={formData.parent_phone}
                                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    required
                                    placeholder="Min 6 characters"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    required
                                    placeholder="Confirm password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                                Back
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                {loading ? <><Loader2 size={18} className="spinner" /> Creating...</> : 'Create Account'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <style>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    background: linear-gradient(135deg, var(--bg-primary) 0%, #1a1a2e 100%);
                }

                .login-card {
                    width: 100%;
                    max-width: 450px;
                    background-color: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg);
                    padding: 2rem;
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 1.5rem;
                }

                .login-logo {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                    color: white;
                }

                .login-header h1 {
                    font-size: 1.25rem;
                    margin-bottom: 0.25rem;
                }

                .login-header p {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                }

                .btn-full {
                    width: 100%;
                }
            `}</style>
        </div>
    );
};

export default StudentRegister;
