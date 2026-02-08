import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlignLeft, Target } from 'lucide-react';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const CalendarEntryModal = ({ isOpen, onClose, onSuccess, entry, classes, collegeId }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'event',
        date: '',
        time: '',
        description: '',
        target: {
            type: 'all',
            class_id: ''
        }

    });

    useEffect(() => {
        if (entry) {
            setFormData({
                title: entry.title || '',
                type: entry.type || 'event',
                date: entry.date || '',
                time: entry.time || '',
                description: entry.description || '',
                target: entry.target || { type: 'all', classId: '' }
            });
        } else {
            // Reset form for new entry
            setFormData({
                title: '',
                type: 'event',
                date: new Date().toISOString().split('T')[0],
                time: '',
                description: '',
                target: {
                    type: 'all',
                    class_id: ''
                }
            });

        }
    }, [entry, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.date) {
            alert("Title and Date are required");
            return;
        }
        if (formData.target.type === 'class' && !formData.target.class_id) {
            alert("Please select a target class");
            return;
        }


        setLoading(true);
        try {
            const entryData = {
                ...formData,
                college_id: collegeId,
                updatedAt: serverTimestamp()
            };


            if (entry?.id) {
                // Update existing
                await updateDoc(doc(db, 'calendar_entries', entry.id), entryData);
            } else {
                // Create new
                await addDoc(collection(db, 'calendar_entries'), {
                    ...entryData,
                    createdBy: user.uid,
                    createdAt: serverTimestamp()
                });
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving calendar entry:", error);
            alert("Failed to save entry");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="entry-form-overlay" onClick={onClose}>
            <div className="entry-form-modal" onClick={e => e.stopPropagation()}>
                <div className="entry-form-header">
                    <h3>{entry ? 'Edit Entry' : 'Add Calendar Entry'}</h3>
                    <button onClick={onClose} className="entry-detail-close">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="entry-form-body">
                    <div className="form-group">
                        <label>Entry Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Independence Day, MID-1 Physics"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Entry Type</label>
                        <div className="entry-type-selector">
                            {['holiday', 'event', 'exam'].map(type => (
                                <div
                                    key={type}
                                    className={`type-option ${formData.type === type ? 'active ' + type : ''}`}
                                    onClick={() => setFormData({ ...formData, type })}
                                >
                                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><Calendar size={14} style={{ marginRight: '6px' }} /> Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label><Clock size={14} style={{ marginRight: '6px' }} /> Time (Optional)</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label><Target size={14} style={{ marginRight: '6px' }} /> Target Audience</label>
                        <div className="target-selector">
                            <div
                                className={`target-option ${formData.target.type === 'all' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, target: { ...formData.target, type: 'all' } })}
                            >
                                Entire College
                            </div>
                            <div
                                className={`target-option ${formData.target.type === 'class' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, target: { ...formData.target, type: 'class' } })}
                            >
                                Specific Class
                            </div>
                        </div>

                        {formData.target.type === 'class' && (
                            <select
                                value={formData.target.class_id}
                                onChange={e => setFormData({
                                    ...formData,
                                    target: { ...formData.target, class_id: e.target.value }
                                })}
                                required
                            >

                                <option value="">Select a Class</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.display_name || `${c.branch} - ${c.section}`}</option>
                                ))}

                            </select>
                        )}
                    </div>

                    <div className="form-group">
                        <label><AlignLeft size={14} style={{ marginRight: '6px' }} /> Description (Optional)</label>
                        <textarea
                            placeholder="Add more details about this entry..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="entry-form-footer">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CalendarEntryModal;
