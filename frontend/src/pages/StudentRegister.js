import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { GraduationCap, ArrowLeft, User, Lock, Phone, Loader2, CheckCircle, ArrowRight, Shield, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/styles.css';
import '../styles/auth.css';

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
        pin: '',
        name: '',
        password: '',
        confirmPassword: '',
        parent_phone: ''
    });

    const selectedClass = classes.find(c => c.id === formData.class_id);

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
            // Validate PIN against class rules if any
            const pinRule = selectedClass?.pin_validation_rule;
            if (pinRule) {
                if (pinRule.type === 'regex') {
                    const regex = new RegExp(pinRule.pattern);
                    if (!regex.test(formData.pin)) {
                        setError(`PIN must match the class format.`);
                        setLoading(false);
                        return;
                    }
                } else if (pinRule.type === 'range') {
                    const pinNum = parseInt(formData.pin);
                    if (isNaN(pinNum) || pinNum < pinRule.min || pinNum > pinRule.max) {
                        setError(`PIN must be between ${pinRule.min} and ${pinRule.max}`);
                        setLoading(false);
                        return;
                    }
                }
            }

            // Check if PIN is already taken
            const existingQuery = query(
                collection(db, 'students'),
                where('college_id', '==', college.id),
                where('class_id', '==', formData.class_id),
                where('pin', '==', formData.pin)
            );
            const existingSnapshot = await getDocs(existingQuery);
            if (!existingSnapshot.empty) {
                setError('This PIN is already registered in your class.');
                setLoading(false);
                return;
            }

            await addDoc(collection(db, 'students'), {
                college_id: college.id,
                class_id: formData.class_id,
                pin: formData.pin,
                name: formData.name,
                password: formData.password,
                parent_phone: formData.parent_phone,
                role: 'student',
                created_at: new Date()
            });

            setGeneratedPin(formData.pin);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Error creating account.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="modern-auth-container">
                <div className="bg-dots"></div>
                <div className="bg-circle circle-1"></div>
                <div className="bg-circle circle-2"></div>

                <div className="auth-content-wrapper form-active">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="modern-auth-card text-center"
                    >
                        <div className="role-badge-icon mx-auto mb-6" style={{ background: 'var(--accent-success)', margin: '0 auto 1.5rem' }}>
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="brand-title" style={{ fontSize: '2rem !important' }}>Success!</h2>
                        <p className="role-badge-text p-0 mb-6">Your student account has been created.</p>

                        <div style={{
                            background: 'rgba(2, 6, 23, 0.4)',
                            padding: '1.5rem',
                            borderRadius: '18px',
                            border: '1px solid #1e293b',
                            marginBottom: '2rem'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Login PIN</span>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#22c55e', letterSpacing: '0.2em', marginTop: '0.5rem' }}>
                                {generatedPin}
                            </div>
                        </div>

                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem' }}>
                            ⚠️ Please save this PIN. You will need it to sign in to your student portal.
                        </p>

                        <button className="modern-btn-submit w-full" onClick={() => navigate('/login')} style={{ '--btn-theme': 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}>
                            Continue to Login
                            <ArrowRight size={20} />
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="modern-auth-container">
            <div className="bg-dots"></div>
            <div className="bg-circle circle-1"></div>
            <div className="bg-circle circle-2"></div>

            <div className="auth-content-wrapper form-active">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="corner-logo"
                >
                    <img src="/campusnet-logo.jpg" alt="Logo" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="auth-brand"
                >
                    <h1 className="brand-title">Campus<span className="text-brand-blue">Net</span></h1>
                    <p className="brand-tagline">── CONNECT • LEARN • SUCCEED ──</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="modern-auth-card"
                >
                    <button className="modern-back-btn" onClick={() => step === 2 ? setStep(1) : navigate('/login')}>
                        <ArrowLeft size={18} />
                        <span>{step === 2 ? 'Back to Step 1' : 'Back to Login'}</span>
                    </button>

                    <div className="auth-role-header" style={{ '--role-theme': 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}>
                        <div className="role-badge-icon">
                            <GraduationCap size={24} />
                        </div>
                        <div className="role-badge-text">
                            <h3>Student Registration</h3>
                            <p>{step === 1 ? 'Verify your college code' : `Join ${college?.name}`}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                        <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= 1 ? '#22c55e' : '#1e293b' }}></div>
                        <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= 2 ? '#22c55e' : '#1e293b' }}></div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="modern-alert"
                        >
                            {error}
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerifyCollege}
                                className="modern-form"
                            >
                                <div className="modern-form-group">
                                    <label>College Code</label>
                                    <div className="modern-input-wrapper">
                                        <Shield size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            placeholder="Enter Code (e.g. DEMO)"
                                            required
                                            value={formData.collegeCode}
                                            onChange={(e) => setFormData({ ...formData, collegeCode: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', marginLeft: '0.5rem' }}>
                                        Contact your administration if you don't have a code.
                                    </p>
                                </div>
                                <button type="submit" className="modern-btn-submit" disabled={loading} style={{ '--btn-theme': 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}>
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <>Continue Registration <ArrowRight size={20} /></>}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSubmit}
                                className="modern-form"
                            >
                                <div className="modern-form-group">
                                    <label>Select Class</label>
                                    <div className="modern-input-wrapper">
                                        <BookOpen size={18} className="input-icon" />
                                        <select
                                            required
                                            value={formData.class_id}
                                            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                        >
                                            <option value="">Choose your class</option>
                                            {classes.map(cls => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.branch} - {cls.section} (Year {cls.year})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="modern-form-group">
                                    <label>Roll Number / PIN</label>
                                    <div className="modern-input-wrapper">
                                        <Shield size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Unique Student ID"
                                            value={formData.pin}
                                            onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="modern-form-group">
                                    <label>Full Name</label>
                                    <div className="modern-input-wrapper">
                                        <User size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Your name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="modern-form-group">
                                    <label>Parent Phone (Optional)</label>
                                    <div className="modern-input-wrapper">
                                        <Phone size={18} className="input-icon" />
                                        <input
                                            type="tel"
                                            placeholder="Mobile Number"
                                            value={formData.parent_phone}
                                            onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="modern-form-group">
                                        <label>Password</label>
                                        <div className="modern-input-wrapper">
                                            <Lock size={18} className="input-icon" />
                                            <input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="modern-form-group">
                                        <label>Confirm</label>
                                        <div className="modern-input-wrapper">
                                            <Lock size={18} className="input-icon" />
                                            <input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="modern-btn-submit" disabled={loading} style={{ '--btn-theme': 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}>
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <>Create Student Account <ArrowRight size={20} /></>}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default StudentRegister;
