import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Shield, Hash, Layers, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ClassManagement = () => {
    const { userData } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newClass, setNewClass] = useState({
        branch: '',
        year: '2024',
        semester: '1',
        section: 'A',
        pinValidationType: 'regex',
        pinPattern: '^24[0-9]{3}$',
        pinMin: 100,
        pinMax: 999
    });

    const fetchClasses = async () => {
        if (!userData?.college_id) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'classes'), where('college_id', '==', userData.college_id));
            const snapshot = await getDocs(q);
            const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(classList);
        } catch (err) {
            console.error("Error fetching classes:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, [userData]);

    const handleAddClass = async (e) => {
        e.preventDefault();
        try {
            const classData = {
                college_id: userData.college_id,
                branch: newClass.branch,
                year: newClass.year,
                semester: newClass.semester,
                section: newClass.section,
                pin_validation_rule: newClass.pinValidationType === 'regex'
                    ? { type: 'regex', pattern: newClass.pinPattern }
                    : { type: 'range', min: parseInt(newClass.pinMin), max: parseInt(newClass.pinMax) }
            };
            await addDoc(collection(db, 'classes'), classData);
            setIsAdding(false);
            fetchClasses();
        } catch (err) {
            console.error("Error adding class:", err);
        }
    };

    const handleDeleteClass = async (id) => {
        if (window.confirm("Are you sure? This will not delete students but will break association.")) {
            await deleteDoc(doc(db, 'classes', id));
            fetchClasses();
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Class Management</h2>
                    <p className="text-slate-400">Manage academic units and student PIN validation rules.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="w-5 h-5" /> New Class
                </button>
            </div>

            {loading ? <div className="text-slate-500">Loading academic units...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map(cls => (
                        <motion.div
                            layout
                            key={cls.id}
                            className="bg-slate-900/40 border border-white/5 p-6 rounded-[24px] backdrop-blur-md group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <button
                                    onClick={() => handleDeleteClass(cls.id)}
                                    className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1">{cls.branch}</h3>
                            <p className="text-slate-500 text-sm font-semibold mb-4 italic">
                                Year {cls.year} • Sem {cls.semester} • Sec {cls.section}
                            </p>

                            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">
                                    <Shield className="w-3 h-3" /> PIN Rule
                                </div>
                                <code className="text-xs text-indigo-300 break-all">
                                    {cls.pin_validation_rule.type === 'regex'
                                        ? `Regex: ${cls.pin_validation_rule.pattern}`
                                        : `Range: ${cls.pin_validation_rule.min} - ${cls.pin_validation_rule.max}`
                                    }
                                </code>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add Class Modal */}
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
                                <h3 className="text-2xl font-bold text-white">Create New Class</h3>
                                <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white"><Plus className="w-6 h-6 rotate-45" /></button>
                            </div>

                            <form onSubmit={handleAddClass} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Branch Name</label>
                                        <input
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all"
                                            placeholder="e.g. Computer Engineering"
                                            value={newClass.branch}
                                            onChange={e => setNewClass({ ...newClass, branch: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Year</label>
                                        <input
                                            required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                                            value={newClass.year}
                                            onChange={e => setNewClass({ ...newClass, year: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Semester</label>
                                        <input
                                            required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                                            value={newClass.semester}
                                            onChange={e => setNewClass({ ...newClass, semester: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 block">PIN Validation Logic</label>
                                    <div className="flex gap-4 mb-6">
                                        <button
                                            type="button"
                                            onClick={() => setNewClass({ ...newClass, pinValidationType: 'regex' })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${newClass.pinValidationType === 'regex' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-800 text-slate-500'}`}
                                        >Regex Pattern</button>
                                        <button
                                            type="button"
                                            onClick={() => setNewClass({ ...newClass, pinValidationType: 'range' })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${newClass.pinValidationType === 'range' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-800 text-slate-500'}`}
                                        >Numeric Range</button>
                                    </div>

                                    {newClass.pinValidationType === 'regex' ? (
                                        <input
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-mono"
                                            value={newClass.pinPattern}
                                            onChange={e => setNewClass({ ...newClass, pinPattern: e.target.value })}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" value={newClass.pinMin} onChange={e => setNewClass({ ...newClass, pinMin: e.target.value })} />
                                            <span className="text-slate-500">to</span>
                                            <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" value={newClass.pinMax} onChange={e => setNewClass({ ...newClass, pinMax: e.target.value })} />
                                        </div>
                                    )}
                                </div>

                                <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                                    Confirm and Create Unit
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClassManagement;
