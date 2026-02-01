import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Trash2, Mail, ShieldAlert, Award, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherHub = () => {
    const { userData } = useAuth();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newTeacher, setNewTeacher] = useState({
        name: '',
        email: '',
        uid: '', // 3 letter code
        password: '',
        isClassTeacher: false,
        classIdAssigned: ''
    });
    const [classes, setClasses] = useState([]);

    const fetchTeachers = async () => {
        if (!userData?.college_id) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'teachers'), where('college_id', '==', userData.college_id));
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTeachers(list);
        } catch (err) {
            console.error("Error fetching teachers:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        if (!userData?.college_id) return;
        const q = query(collection(db, 'classes'), where('college_id', '==', userData.college_id));
        const snapshot = await getDocs(q);
        setClasses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    useEffect(() => {
        fetchTeachers();
        fetchClasses();
    }, [userData]);

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create firebase auth account
            const userCred = await createUserWithEmailAndPassword(auth, newTeacher.email, newTeacher.password);

            // 2. Create teacher document
            await setDoc(doc(db, 'teachers', userCred.user.uid), {
                uid: newTeacher.uid,
                name: newTeacher.name,
                email: newTeacher.email,
                college_id: userData.college_id,
                role: 'teacher',
                is_class_teacher: newTeacher.isClassTeacher,
                class_id_assigned: newTeacher.classIdAssigned,
                created_at: new Date()
            });

            setIsAdding(false);
            fetchTeachers();
        } catch (err) {
            console.error("Error creating teacher:", err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Teacher Hub</h2>
                    <p className="text-slate-400">Onboard faculty and assign class teacher responsibilities.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" /> Add Faculty
                </button>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-md">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        <tr>
                            <th className="px-8 py-5">UID</th>
                            <th className="px-8 py-5">Teacher</th>
                            <th className="px-8 py-5">Role</th>
                            <th className="px-8 py-5">Assigned Class</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {teachers.map(t => (
                            <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-8 py-5">
                                    <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg font-mono text-sm border border-indigo-500/20">{t.uid}</span>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="font-bold text-white">{t.name}</div>
                                    <div className="text-xs text-slate-500">{t.email}</div>
                                </td>
                                <td className="px-8 py-5">
                                    {t.is_class_teacher ? (
                                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                                            <Award className="w-4 h-4" /> Class Teacher
                                        </div>
                                    ) : (
                                        <span className="text-slate-500 text-sm">Subject Teacher</span>
                                    )}
                                </td>
                                <td className="px-8 py-5 text-slate-400 text-sm">
                                    {t.class_id_assigned || 'Not Assigned'}
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Teacher Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-white">Add New Teacher</h3>
                                <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white"><LogOut className="w-6 h-6 rotate-45" /></button>
                            </div>

                            <form onSubmit={handleAddTeacher} className="p-8 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Full Name</label>
                                        <input
                                            required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
                                            value={newTeacher.name}
                                            onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">3-Letter UID</label>
                                        <input
                                            required maxLength={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-center font-bold tracking-widest uppercase"
                                            value={newTeacher.uid}
                                            placeholder="ABC"
                                            onChange={e => setNewTeacher({ ...newTeacher, uid: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Password</label>
                                        <input
                                            type="password" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
                                            value={newTeacher.password}
                                            onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Login Email</label>
                                        <input
                                            type="email" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
                                            value={newTeacher.email}
                                            onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-white font-bold text-sm flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-indigo-400" /> Class Teacher Privileges
                                        </h4>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">Allows attendance editing and tracking</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-indigo-600 cursor-pointer"
                                        checked={newTeacher.isClassTeacher}
                                        onChange={e => setNewTeacher({ ...newTeacher, isClassTeacher: e.target.checked })}
                                    />
                                </div>

                                {newTeacher.isClassTeacher && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">Assign to Class</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm"
                                            value={newTeacher.classIdAssigned}
                                            onChange={e => setNewTeacher({ ...newTeacher, classIdAssigned: e.target.value })}
                                        >
                                            <option value="">Select a class...</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.branch} - Year {c.year} ({c.section})</option>)}
                                        </select>
                                    </div>
                                )}

                                <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 mt-4">
                                    Register Faculty Member
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherHub;
