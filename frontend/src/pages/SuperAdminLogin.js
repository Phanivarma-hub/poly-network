import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/auth.css';

const SuperAdminLogin = () => {
    const { loginWithEmail } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await loginWithEmail(formData.email, formData.password);
            navigate('/super-admin');
        } catch (err) {
            setError('Access Denied. Invalid Super Admin credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modern-auth-container" style={{ background: '#0f172a' }}>
            <div className="bg-dots"></div>
            <div className="auth-content-wrapper form-active">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="modern-auth-card"
                    style={{ borderTop: '4px solid #f59e0b' }}
                >
                    <div className="auth-role-header">
                        <div className="role-badge-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            <Shield size={24} />
                        </div>
                        <div className="role-badge-text">
                            <h3>Platform Administration</h3>
                            <p>Authorized access only. Logging enabled.</p>
                        </div>
                    </div>

                    {error && <div className="modern-alert">{error}</div>}

                    <form onSubmit={handleSubmit} className="modern-form">
                        <div className="modern-form-group">
                            <label>Admin Email</label>
                            <div className="modern-input-wrapper">
                                <User size={18} className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="admin@platform.net"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="modern-form-group">
                            <label>Secure Key</label>
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

                        <button
                            type="submit"
                            className="modern-btn-submit"
                            disabled={loading}
                            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    Enter Command Center
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

export default SuperAdminLogin;
