import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Mail, Lock, Shield, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

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
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl z-10"
            >
                <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row">
                    {/* Left Side: Info */}
                    <div className="md:w-5/12 bg-indigo-600 p-10 flex flex-col justify-between text-white">
                        <div>
                            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                                <Shield className="w-7 h-7" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4 tracking-tight leading-tight">Join the Network</h2>
                            <p className="text-indigo-100 text-sm leading-relaxed">
                                Connect your college to the future of academic management. Secure, scalable, and isolated.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-indigo-100">
                                <CheckCircle2 className="w-5 h-5 text-indigo-300" />
                                Multi-tenant isolation
                            </div>
                            <div className="flex items-center gap-3 text-sm text-indigo-100">
                                <CheckCircle2 className="w-5 h-5 text-indigo-300" />
                                Unified dashboard
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="md:w-7/12 p-10 bg-slate-900/40">
                        <form onSubmit={handleRegister} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1 ml-1">College Name</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                        <input
                                            name="collegeName"
                                            type="text"
                                            required
                                            placeholder="e.g. Stanford University"
                                            className="w-full bg-slate-950/50 border border-slate-800 text-white pl-11 pr-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all text-sm"
                                            value={formData.collegeName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1 ml-1">College Code (Unique)</label>
                                    <div className="relative group">
                                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                        <input
                                            name="collegeCode"
                                            type="text"
                                            required
                                            placeholder="e.g. STAN01"
                                            className="w-full bg-slate-950/50 border border-slate-800 text-white pl-11 pr-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all text-sm"
                                            value={formData.collegeCode}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-800 my-4"></div>

                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1 ml-1">Admin Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="admin@college.edu"
                                        className="w-full bg-slate-950/50 border border-slate-800 text-white pl-11 pr-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all text-sm"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1 ml-1">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                        <input
                                            name="password"
                                            type="password"
                                            required
                                            className="w-full bg-slate-950/50 border border-slate-800 text-white pl-11 pr-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all text-sm"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1 ml-1">Confirm</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                        <input
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            className="w-full bg-slate-950/50 border border-slate-800 text-white pl-11 pr-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all text-sm"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl mt-4 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-600/20"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                    <>
                                        Initialize College Network
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <div className="text-center mt-4">
                                <span className="text-slate-500 text-xs">Already have a network? </span>
                                <Link to="/login" className="text-indigo-400 text-xs hover:underline font-bold">Sign In</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminRegister;
