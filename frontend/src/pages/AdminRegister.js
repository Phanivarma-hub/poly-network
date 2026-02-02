import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Mail, Lock, Shield, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import '../styles/styles.css';
import '../styles/auth.css';

const AdminRegister = () => {
    const [formData, setFormData] = useState({
        collegeName: '',
        collegeCode: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'collegeCode' ? value.toUpperCase() : value
        }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);

        try {
            // 1. Check if college code is unique
            const q = query(collection(db, 'colleges'), where('code', '==', formData.collegeCode));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                throw new Error('This College Code is already registered.');
            }

            // 2. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 3. Create College Document
            const collegeId = `col_${Date.now()}`;
            await setDoc(doc(db, 'colleges', collegeId), {
                name: formData.collegeName,
                code: formData.collegeCode,
                created_at: new Date(),
                settings: {
                    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    periodsPerDay: 8,
                    lunchAfterPeriod: 4
                }
            });

            // 4. Create Admin Document
            await setDoc(doc(db, 'admins', user.uid), {
                uid: user.uid,
                email: formData.email,
                college_id: collegeId,
                role: 'admin',
                created_at: new Date()
            });

            navigate('/admin/settings');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modern-auth-container">
            {/* Background Decor */}
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
                    <Link to="/login" className="modern-back-btn">
                        <ArrowLeft size={18} />
                        <span>Back to Login</span>
                    </Link>

                    <div className="auth-role-header" style={{ '--role-theme': 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }}>
                        <div className="role-badge-icon">
                            <Shield size={24} />
                        </div>
                        <div className="role-badge-text">
                            <h3>College Registration</h3>
                            <p>Initialize your institute network</p>
                        </div>
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

                    <form onSubmit={handleRegister} className="modern-form">
                        <div className="modern-form-group">
                            <label>College Name</label>
                            <div className="modern-input-wrapper">
                                <Building2 size={18} className="input-icon" />
                                <input
                                    name="collegeName"
                                    type="text"
                                    required
                                    placeholder="e.g. Stanford University"
                                    value={formData.collegeName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="modern-form-group">
                            <label>College Code (Unique)</label>
                            <div className="modern-input-wrapper">
                                <Shield size={18} className="input-icon" />
                                <input
                                    name="collegeCode"
                                    type="text"
                                    required
                                    placeholder="e.g. STAN01"
                                    value={formData.collegeCode}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="modern-form-group">
                            <label>Admin Email</label>
                            <div className="modern-input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="admin@college.edu"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="modern-form-group">
                                <label>Password</label>
                                <div className="modern-input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="modern-form-group">
                                <label>Confirm Password</label>
                                <div className="modern-input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="modern-btn-submit" disabled={loading}>
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    Initialize College Network
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminRegister;
