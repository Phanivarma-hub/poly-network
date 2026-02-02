import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Shield, User, Users, Lock, ArrowRight, ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/styles.css';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState({
        collegeCode: '',
        userId: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const roles = [
        {
            id: 'admin',
            label: 'Admin',
            icon: Shield,
            description: 'Institue Management',
            color: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            bgLight: 'rgba(99, 102, 241, 0.1)',
            hasRegister: true,
            registerPath: '/register-college',
            registerLabel: 'Register College'
        },
        {
            id: 'student',
            label: 'Student',
            icon: GraduationCap,
            description: 'Learning Resources',
            color: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
            bgLight: 'rgba(34, 197, 94, 0.1)',
            hasRegister: true,
            registerPath: '/register-student',
            registerLabel: 'New Student'
        },
        {
            id: 'teacher',
            label: 'Teacher',
            icon: Users,
            description: 'Academic Faculty',
            color: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            bgLight: 'rgba(139, 92, 246, 0.1)',
            hasRegister: false
        }
    ];



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);



        try {
            const { role } = await login(
                formData.collegeCode,
                formData.userId,
                formData.password
            );

            if (role !== selectedRole) {
                setError(`Invalid credentials. This is not a ${selectedRole} account.`);
                setLoading(false);
                return;
            }

            navigate(`/${role}`);
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setSelectedRole(null);
        setError('');
        setFormData({ collegeCode: '', userId: '', password: '' });
    };

    const currentRole = roles.find(r => r.id === selectedRole);

    return (
        <div className="modern-login-container">
            {/* Background Decorative Elements */}
            <div className="bg-dots"></div>
            <div className="bg-circle circle-1"></div>
            <div className="bg-circle circle-2"></div>

            <div className={`login-content-wrapper ${selectedRole ? 'form-active' : ''}`}>
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
                    className="login-brand"
                >
                    <h1 className="brand-title">Campus<span className="text-brand-blue">Net</span></h1>
                    <p className="brand-tagline">── CONNECT • LEARN • SUCCEED ──</p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {!selectedRole ? (
                        <motion.div
                            key="role-selection"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modern-role-selection"
                        >
                            <h2 className="selection-title">Choose Your Identity</h2>
                            <div className="modern-role-grid">
                                {roles.map((role) => (
                                    <motion.div
                                        key={role.id}
                                        whileHover={{ y: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="role-card-wrapper"
                                    >
                                        <button
                                            className="modern-role-card"
                                            onClick={() => setSelectedRole(role.id)}
                                            style={{ '--role-color': role.color, '--role-bg': role.bgLight }}
                                        >
                                            <div className="role-icon-box">
                                                <role.icon size={48} />
                                            </div>
                                            <div className="role-meta">
                                                <span className="role-title">{role.label}</span>
                                                <span className="role-info">{role.description}</span>
                                            </div>
                                        </button>
                                        {role.hasRegister && (
                                            <Link to={role.registerPath} className="modern-register-link">
                                                {role.registerLabel}
                                            </Link>
                                        )}
                                    </motion.div>
                                ))}
                            </div>


                        </motion.div>
                    ) : (
                        <motion.div
                            key="login-form"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="modern-login-card"
                        >
                            <button className="modern-back-btn" onClick={handleBack}>
                                <ArrowLeft size={18} />
                                <span>Change Role</span>
                            </button>

                            <div className="login-role-header" style={{ '--role-theme': currentRole.color }}>
                                <div className="role-badge-icon">
                                    <currentRole.icon size={24} />
                                </div>
                                <div className="role-badge-text">
                                    <h3>{currentRole.label} Entrance</h3>
                                    <p>Please provide your credentials to continue</p>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="modern-alert alert-error"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="modern-form">
                                <div className="modern-form-group">
                                    <label>College Code</label>
                                    <div className="modern-input-wrapper">
                                        <Shield size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            placeholder="e.g. PIT01"
                                            required
                                            value={formData.collegeCode}
                                            onChange={(e) => setFormData({ ...formData, collegeCode: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                </div>

                                <div className="modern-form-group">
                                    <label>{selectedRole === 'student' ? 'Student ID / PIN' : 'User ID / Email'}</label>
                                    <div className="modern-input-wrapper">
                                        <User size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            placeholder={selectedRole === 'student' ? 'Enter PIN' : 'Enter ID'}
                                            required
                                            value={formData.userId}
                                            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="modern-form-group">
                                    <label>Access Password</label>
                                    <div className="modern-input-wrapper">
                                        <Lock size={18} className="input-icon" />
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="modern-btn-submit" disabled={loading} style={{ background: currentRole.color }}>
                                    {loading ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            Authorize Access
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                .modern-login-container {
                    min-height: 100vh;
                    width: 100vw;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #020617;
                    color: #f8fafc;
                    font-family: 'Inter', sans-serif;
                    position: relative;
                    overflow: hidden;
                    padding: 2rem;
                }

                .bg-dots {
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(#1e293b 1px, transparent 1px);
                    background-size: 32px 32px;
                    opacity: 0.3;
                    z-index: 0;
                }

                .bg-circle {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(120px);
                    z-index: 0;
                }

                .circle-1 {
                    width: 500px;
                    height: 500px;
                    background: rgba(99, 102, 241, 0.15);
                    top: -100px;
                    right: -100px;
                }

                .circle-2 {
                    width: 400px;
                    height: 400px;
                    background: rgba(139, 92, 246, 0.1);
                    bottom: -100px;
                    left: -100px;
                }

                .login-content-wrapper {
                    width: 100%;
                    max-width: 1000px;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3rem;
                    transition: all 0.5s ease;
                }

                .login-content-wrapper.form-active {
                    max-width: 500px;
                }

                .corner-logo {
                    position: absolute;
                    top: 2rem;
                    left: 2rem;
                    width: 60px;
                    height: 60px;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 8px 20px -5px rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    z-index: 100;
                }

                .corner-logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .login-brand {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .brand-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 3.5rem !important;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    margin-bottom: 0 !important;
                    color: white;
                }

                .text-brand-blue {
                    color: #3b82f6;
                }

                .brand-tagline {
                    color: #3b82f6;
                    font-size: 0.8rem;
                    font-weight: 600;
                    letter-spacing: 0.2em;
                    margin-top: 0.5rem;
                    opacity: 0.8;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .modern-role-selection {
                    width: 100%;
                }

                .selection-title {
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.2rem;
                    color: #64748b;
                    text-align: center;
                    margin-bottom: 2rem;
                    font-weight: 700;
                }

                .modern-role-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    width: 100%;
                }

                .modern-role-card-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                .modern-role-card {
                    width: 100%;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 32px;
                    padding: 3rem 1.5rem;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1.5rem;
                }

                .modern-role-card:hover {
                    border-color: rgba(255, 255, 255, 0.2);
                    background: rgba(30, 41, 59, 0.7);
                    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
                }

                .card-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                }

                .role-icon-box {
                    width: 100px;
                    height: 100px;
                    background: var(--role-theme);
                    color: #fff;
                    border-radius: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.4);
                    transition: transform 0.3s ease;
                }

                .modern-role-card:hover .role-icon-box {
                    transform: scale(1.1);
                }

                .role-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                }

                .role-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #fff;
                    font-family: 'Outfit', sans-serif;
                }

                .role-info {
                    font-size: 0.875rem;
                    color: #94a3b8;
                }

                .role-action-indicator {
                    color: #64748b;
                    transition: all 0.3s ease;
                }

                .modern-role-card:hover .role-action-indicator {
                    color: #fff;
                    transform: translateX(5px);
                }

                .modern-register-link {
                    font-size: 0.75rem;
                    color: #64748b;
                    text-decoration: none;
                    background: rgba(30, 41, 59, 0.5);
                    padding: 0.4rem 1rem;
                    border-radius: 99px;
                    transition: all 0.2s;
                }

                .modern-register-link:hover {
                    color: #fff;
                    background: #334155;
                }

                .modern-login-card {
                    width: 100%;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 40px;
                    padding: 3rem;
                    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.5);
                }

                .modern-back-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: none;
                    border: none;
                    color: #64748b;
                    font-size: 0.875rem;
                    cursor: pointer;
                    margin-bottom: 2rem;
                    padding: 0;
                    transition: color 0.2s;
                }

                .modern-back-btn:hover {
                    color: #fff;
                }

                .login-role-header {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    margin-bottom: 2.5rem;
                }

                .role-badge-icon {
                    width: 56px;
                    height: 56px;
                    background: var(--role-theme);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .role-badge-text h3 {
                    font-size: 1.25rem;
                    margin-bottom: 0.2rem;
                    font-family: 'Outfit', sans-serif;
                }

                .role-badge-text p {
                    font-size: 0.875rem;
                    color: #64748b;
                }

                .modern-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .modern-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .modern-form-group label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    margin-left: 0.5rem;
                }

                .modern-input-wrapper {
                    position: relative;
                }

                .modern-input-wrapper .input-icon {
                    position: absolute;
                    left: 1.25rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #475569;
                    transition: color 0.2s;
                }

                .modern-input-wrapper input {
                    width: 100%;
                    background: rgba(2, 6, 23, 0.4);
                    border: 1px solid #1e293b;
                    border-radius: 18px;
                    padding: 1.125rem 1rem 1.125rem 3.5rem;
                    color: white;
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.2s;
                }

                .modern-input-wrapper input:focus {
                    border-color: #6366f1;
                    background: rgba(2, 6, 23, 0.6);
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }

                .modern-input-wrapper input:focus + .input-icon {
                    color: #6366f1;
                }

                .modern-btn-submit {
                    margin-top: 1rem;
                    padding: 1.125rem;
                    border-radius: 18px;
                    border: none;
                    color: white;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    transition: all 0.3s;
                    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3);
                }

                .modern-btn-submit:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.4);
                    filter: brightness(1.1);
                }

                .modern-alert {
                    padding: 1rem;
                    border-radius: 14px;
                    font-size: 0.875rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    background: rgba(239, 68, 68, 0.1);
                    color: #fca5a5;
                }

                @media (max-width: 900px) {
                    .modern-role-grid {
                        grid-template-columns: 1fr;
                        max-width: 400px;
                    }
                    
                    .modern-role-card {
                        padding: 1.5rem;
                    }

                    .login-brand h1 {
                        font-size: 2rem;
                    }

                    .login-content-wrapper {
                        gap: 2rem;
                    }
                }

            `}</style>
        </div>
    );
};

export default Login;

