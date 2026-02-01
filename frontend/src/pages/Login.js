import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Shield, User, Users, Lock, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
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
            description: 'College administrators',
            color: '#6366f1',
            hasRegister: true,
            registerPath: '/register-college',
            registerLabel: 'Register College'
        },
        {
            id: 'teacher',
            label: 'Teacher',
            icon: Users,
            description: 'Faculty members',
            color: '#8b5cf6',
            hasRegister: false
        },
        {
            id: 'student',
            label: 'Student',
            icon: GraduationCap,
            description: 'Students & learners',
            color: '#22c55e',
            hasRegister: true,
            registerPath: '/register-student',
            registerLabel: 'New Student Registration'
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

            // Verify role matches selection
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
        <div className="login-container">
            <div className="login-card">
                {/* Logo */}
                <div className="login-header">
                    <div className="login-logo">
                        <GraduationCap size={32} />
                    </div>
                    <h1>Poly Network</h1>
                    <p>Multi-College Academic Platform</p>
                </div>

                {/* Role Selection */}
                {!selectedRole ? (
                    <div className="role-selection">
                        <h2>Select Your Role</h2>
                        <div className="role-cards">
                            {roles.map(role => (
                                <div key={role.id} className="role-card-wrapper">
                                    <button
                                        className="role-card"
                                        onClick={() => setSelectedRole(role.id)}
                                        style={{ '--role-color': role.color }}
                                    >
                                        <div className="role-icon">
                                            <role.icon size={28} />
                                        </div>
                                        <div className="role-info">
                                            <span className="role-label">{role.label}</span>
                                            <span className="role-desc">{role.description}</span>
                                        </div>
                                        <ArrowRight size={18} className="role-arrow" />
                                    </button>
                                    {role.hasRegister && (
                                        <Link to={role.registerPath} className="register-link">
                                            {role.registerLabel} →
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Login Form */
                    <div className="login-form-container">
                        <button className="back-btn" onClick={handleBack}>
                            <ArrowLeft size={16} /> Back
                        </button>

                        <div className="login-role-badge" style={{ '--role-color': currentRole.color }}>
                            <currentRole.icon size={18} />
                            <span>{currentRole.label} Login</span>
                        </div>

                        {error && (
                            <div className="alert alert-error">{error}</div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">College Code</label>
                                <div className="input-icon-wrapper">
                                    <Shield size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input with-icon"
                                        placeholder="e.g. DEMO"
                                        required
                                        value={formData.collegeCode}
                                        onChange={(e) => setFormData({ ...formData, collegeCode: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    {selectedRole === 'student' ? 'Student PIN' : 'User ID / Email'}
                                </label>
                                <div className="input-icon-wrapper">
                                    <User size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input with-icon"
                                        placeholder={selectedRole === 'student' ? 'Enter your PIN' : 'Enter your ID'}
                                        required
                                        value={formData.userId}
                                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="input-icon-wrapper">
                                    <Lock size={16} className="input-icon" />
                                    <input
                                        type="password"
                                        className="form-input with-icon"
                                        placeholder="Enter your password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="spinner" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        {currentRole.hasRegister && (
                            <div className="login-footer">
                                <Link to={currentRole.registerPath}>{currentRole.registerLabel}</Link>
                            </div>
                        )}
                    </div>
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
                    max-width: 420px;
                    background-color: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg);
                    padding: 2.5rem;
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
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
                    font-size: 1.5rem;
                    margin-bottom: 0.25rem;
                }

                .login-header p {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                }

                .role-selection h2 {
                    font-size: 1rem;
                    text-align: center;
                    color: var(--text-muted);
                    margin-bottom: 1.25rem;
                }

                .role-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .role-card-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .role-card {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem 1.25rem;
                    background-color: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                }

                .role-card:hover {
                    border-color: var(--role-color);
                    background-color: rgba(99, 102, 241, 0.05);
                }

                .role-icon {
                    width: 48px;
                    height: 48px;
                    background-color: rgba(99, 102, 241, 0.1);
                    border-radius: var(--border-radius);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--role-color);
                }

                .role-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .role-label {
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .role-desc {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .role-arrow {
                    color: var(--text-muted);
                    transition: transform 0.2s;
                }

                .role-card:hover .role-arrow {
                    transform: translateX(4px);
                    color: var(--role-color);
                }

                .register-link {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-decoration: none;
                    padding-left: 4rem;
                    transition: color 0.15s;
                }

                .register-link:hover {
                    color: var(--accent-primary);
                }

                .back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    font-size: 0.875rem;
                    cursor: pointer;
                    margin-bottom: 1rem;
                    padding: 0;
                }

                .back-btn:hover {
                    color: var(--text-primary);
                }

                .login-role-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background-color: rgba(99, 102, 241, 0.1);
                    color: var(--role-color);
                    padding: 0.5rem 1rem;
                    border-radius: var(--border-radius);
                    font-size: 0.875rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                }

                .input-icon-wrapper {
                    position: relative;
                }

                .input-icon {
                    position: absolute;
                    left: 0.875rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                }

                .form-input.with-icon {
                    padding-left: 2.5rem;
                }

                .btn-full {
                    width: 100%;
                    margin-top: 0.5rem;
                }

                .login-footer {
                    text-align: center;
                    margin-top: 1.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--border-color);
                }

                .login-footer a {
                    color: var(--accent-primary);
                    text-decoration: none;
                    font-size: 0.875rem;
                }

                .login-footer a:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
};

export default Login;
