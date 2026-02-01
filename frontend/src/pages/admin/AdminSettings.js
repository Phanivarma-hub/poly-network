import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Save, Calendar, Clock, Coffee, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminSettings = () => {
    const { userData } = useAuth();
    const [settings, setSettings] = useState({
        workingDays: [],
        periodsPerDay: 8,
        lunchAfterPeriod: 4
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!userData?.college_id) return;
            try {
                const docSnap = await getDoc(doc(db, 'colleges', userData.college_id));
                if (docSnap.exists()) {
                    setSettings(docSnap.data().settings || {
                        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                        periodsPerDay: 8,
                        lunchAfterPeriod: 4
                    });
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [userData]);

    const handleDayToggle = (day) => {
        setSettings(prev => ({
            ...prev,
            workingDays: prev.workingDays.includes(day)
                ? prev.workingDays.filter(d => d !== day)
                : [...prev.workingDays, day]
        }));
    };

    const saveSettings = async () => {
        setSaving(true);
        setSuccess(false);
        try {
            await updateDoc(doc(db, 'colleges', userData.college_id), {
                settings: settings
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving settings:", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white">Loading configuration...</div>;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="max-w-4xl">
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">College Settings</h2>
                <p className="text-slate-400">Configure global academic rules and base structure.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Working Days */}
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Working Days</h3>
                    </div>

                    <div className="space-y-3">
                        {days.map(day => (
                            <button
                                key={day}
                                onClick={() => handleDayToggle(day)}
                                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all border ${settings.workingDays.includes(day)
                                        ? 'bg-indigo-600/20 border-indigo-500/30 text-white'
                                        : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                            >
                                <span className="font-semibold">{day}</span>
                                {settings.workingDays.includes(day) && <CheckCircle className="w-4 h-4 text-indigo-400" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Structure */}
                <div className="space-y-8">
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Academic Day</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-3">Periods per day</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="4" max="10"
                                        value={settings.periodsPerDay}
                                        onChange={(e) => setSettings({ ...settings, periodsPerDay: parseInt(e.target.value) })}
                                        className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-2xl font-bold text-white w-8">{settings.periodsPerDay}</span>
                                </div>
                            </div>

                            <div className="h-px bg-slate-800"></div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-400 mb-4">
                                    <Coffee className="w-4 h-4" />
                                    Lunch Break after Period
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[3, 4, 5, 6].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setSettings({ ...settings, lunchAfterPeriod: p })}
                                            className={`py-3 rounded-xl font-bold transition-all border ${settings.lunchAfterPeriod === p
                                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                                                    : 'bg-slate-950/50 border-slate-800 text-slate-500'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className={`w-full py-5 rounded-[24px] font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-2xl ${success
                                ? 'bg-emerald-500 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                            }`}
                    >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            success ? (
                                <> <CheckCircle className="w-6 h-6" /> Configuration Saved </>
                            ) : (
                                <> <Save className="w-6 h-6" /> Deploy Settings </>
                            )
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
