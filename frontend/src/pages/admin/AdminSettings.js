import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Save, Loader2 } from 'lucide-react';

const AdminSettings = () => {
    const { userData } = useAuth();
    const [settings, setSettings] = useState({
        working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        periods_per_day: 8,
        lunch_after_period: 4,
        study_hour_period: 8
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        const fetchSettings = async () => {
            if (!userData?.college_id) return;

            try {
                const collegeDoc = await getDoc(doc(db, 'colleges', userData.college_id));
                if (collegeDoc.exists()) {
                    const data = collegeDoc.data();
                    if (data.settings) {
                        setSettings({
                            working_days: data.settings.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                            periods_per_day: data.settings.periods_per_day || 8,
                            lunch_after_period: data.settings.lunch_after_period || 4,
                            study_hour_period: data.settings.study_hour_period || 8
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [userData]);

    const handleDayToggle = (day) => {
        setSettings(prev => {
            const days = prev.working_days.includes(day)
                ? prev.working_days.filter(d => d !== day)
                : [...prev.working_days, day];
            return { ...prev, working_days: days };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await updateDoc(doc(db, 'colleges', userData.college_id), {
                settings: settings
            });
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                Loading settings...
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">College Settings</h1>
                    <p className="page-description">Configure your college's academic schedule and preferences.</p>
                </div>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="card">
                <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Working Days</h3>
                <div className="days-grid">
                    {allDays.map(day => (
                        <label key={day} className="day-checkbox">
                            <input
                                type="checkbox"
                                className="checkbox"
                                checked={settings.working_days.includes(day)}
                                onChange={() => handleDayToggle(day)}
                            />
                            <span>{day}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="card" style={{ marginTop: '1rem' }}>
                <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Period Configuration</h3>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Periods Per Day</label>
                        <input
                            type="number"
                            className="form-input"
                            min="1"
                            max="12"
                            value={settings.periods_per_day}
                            onChange={(e) => setSettings(prev => ({ ...prev, periods_per_day: parseInt(e.target.value) || 8 }))}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Lunch After Period</label>
                        <input
                            type="number"
                            className="form-input"
                            min="1"
                            max={settings.periods_per_day}
                            value={settings.lunch_after_period}
                            onChange={(e) => setSettings(prev => ({ ...prev, lunch_after_period: parseInt(e.target.value) || 4 }))}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Study Hour Period</label>
                    <input
                        type="number"
                        className="form-input"
                        min="1"
                        max={settings.periods_per_day}
                        value={settings.study_hour_period}
                        onChange={(e) => setSettings(prev => ({ ...prev, study_hour_period: parseInt(e.target.value) || 8 }))}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        The last period of the day typically used for self-study
                    </small>
                </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 size={16} className="spinner" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Save Settings
                        </>
                    )}
                </button>
            </div>

            <style>{`
                .days-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 0.75rem;
                }

                .day-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    background-color: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    transition: border-color 0.15s;
                }

                .day-checkbox:hover {
                    border-color: var(--accent-primary);
                }
            `}</style>
        </div>
    );
};

export default AdminSettings;
