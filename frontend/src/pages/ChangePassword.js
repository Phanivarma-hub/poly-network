import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import '../styles/auth.css';

const ChangePassword = () => {
    const { user, userData, logout } = useAuth();
    const navigate = useNavigate();
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (passwords.newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            // 1. Update Password in Firebase Auth
            await updatePassword(auth.currentUser, passwords.newPassword);

            // 2. Update must_change_password in Firestore
            const collectionMap = {
                admin: 'admins',
                teacher: 'teachers',
                student: 'students'
            };

            const collectionName = collectionMap[userData.role];
            if (collectionName) {
                await updateDoc(doc(db, collectionName, user.uid), {
                    must_change_password: false
                });
            }

            // 3. Success - Redirect to dashboard
            navigate(`/${userData.role}`);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to update password. You may need to log in again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modern-auth-container">
            <div className="bg-dots"></div>
            <div className="auth-content-wrapper form-active">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="modern-auth-card"
                >
                    <div className="auth-role-header">
                        <div className="role-badge-icon">
                            <Key size={24} />
                        </div>
                        <div className="role-badge-text">
                            <h3>Security Update</h3>
                            <p>You must change your temporary password to continue</p>
                        </div>
                    </div>

                    {error && <div className="modern-alert">{error}</div>}

                    <form onSubmit={handleSubmit} className="modern-form">
                        <div className="modern-form-group">
                            <label>New Password</label>
                            <div className="modern-input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="modern-form-group">
                            <label>Confirm New Password</label>
                            <div className="modern-input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <button type="submit" className="modern-btn-submit" disabled={loading}>
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    Update Password & Continue
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        <button type="button" onClick={logout} className="text-sm text-gray-500 mt-4 underline w-full text-center">
                            Cancel and Logout
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ChangePassword;
