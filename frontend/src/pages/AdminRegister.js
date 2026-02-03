import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Mail, Shield, ArrowRight, Loader2, ArrowLeft, User, Phone, Users } from 'lucide-react';
import '../styles/auth.css';

const AdminRegister = () => {
    const [formData, setFormData] = useState({
        collegeName: '',
        collegeAddress: '',
        collegeType: '',
        officialEmail: '',
        contactPerson: '',
        contactRole: '',
        phoneNumber: '',
        studentCount: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await addDoc(collection(db, 'registration_requests'), {
                ...formData,
                status: 'pending',
                created_at: new Date()
            });
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Submission failed.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="modern-auth-container">
                <div className="bg-dots"></div>
                <div className="auth-content-wrapper form-active">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="modern-auth-card text-center p-8">
                        <div className="role-badge-icon mx-auto mb-4" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                            <Shield size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Request Submitted</h2>
                        <p className="text-gray-600 mb-6">Thank you for your interest. Our platform team will review your application and contact you via email with your credentials shortly.</p>
                        <Link to="/login" className="modern-btn-submit inline-block">Back to Home</Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="modern-auth-container">
            <div className="bg-dots"></div>
            <div className="auth-content-wrapper form-active" style={{ maxWidth: '800px' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="modern-auth-card">
                    <Link to="/login" className="modern-back-btn">
                        <ArrowLeft size={18} />
                        <span>Back to Login</span>
                    </Link>

                    <div className="auth-role-header">
                        <div className="role-badge-icon">
                            <Building2 size={24} />
                        </div>
                        <div className="role-badge-text">
                            <h3>Register Your College</h3>
                            <p>Submit details for platform onboarding</p>
                        </div>
                    </div>

                    {error && <div className="modern-alert">{error}</div>}

                    <form onSubmit={handleSubmit} className="modern-form grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="modern-form-group">
                            <label>College Name</label>
                            <div className="modern-input-wrapper">
                                <Building2 size={18} className="input-icon" />
                                <input name="collegeName" type="text" required placeholder="Full Institute Name" value={formData.collegeName} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="modern-form-group">
                            <label>College Type</label>
                            <div className="modern-input-wrapper">
                                <Shield size={18} className="input-icon" />
                                <select name="collegeType" required value={formData.collegeType} onChange={handleChange} className="w-full bg-transparent border-none outline-none">
                                    <option value="">Select Type</option>
                                    <option value="Polytechnic">Polytechnic</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Vocational">Vocational</option>
                                </select>
                            </div>
                        </div>

                        <div className="modern-form-group md:col-span-2">
                            <label>College Address</label>
                            <div className="modern-input-wrapper">
                                <Building2 size={18} className="input-icon" />
                                <input name="collegeAddress" type="text" required placeholder="City, State, Country" value={formData.collegeAddress} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="modern-form-group">
                            <label>Official College Email</label>
                            <div className="modern-input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input name="officialEmail" type="email" required placeholder="contact@college.edu" value={formData.officialEmail} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="modern-form-group">
                            <label>Phone Number</label>
                            <div className="modern-input-wrapper">
                                <Phone size={18} className="input-icon" />
                                <input name="phoneNumber" type="tel" required placeholder="Primary Contact Number" value={formData.phoneNumber} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="modern-form-group">
                            <label>Contact Person Name</label>
                            <div className="modern-input-wrapper">
                                <User size={18} className="input-icon" />
                                <input name="contactPerson" type="text" required placeholder="Principal / Admin Name" value={formData.contactPerson} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="modern-form-group">
                            <label>Contact Person Role</label>
                            <div className="modern-input-wrapper">
                                <Shield size={18} className="input-icon" />
                                <input name="contactRole" type="text" required placeholder="e.g. Principal" value={formData.contactRole} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="modern-form-group">
                            <label>Estimated Student Count</label>
                            <div className="modern-input-wrapper">
                                <Users size={18} className="input-icon" />
                                <input name="studentCount" type="number" required placeholder="e.g. 1200" value={formData.studentCount} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <button type="submit" className="modern-btn-submit w-full" disabled={loading}>
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <>Submit Registration Request <ArrowRight size={20} /></>}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminRegister;
