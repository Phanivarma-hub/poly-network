import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { Shield, Check, X, Building, Mail, User, Phone, Users, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SuperAdminDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [stats, setStats] = useState({ pending: 0, totalColleges: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const reqSnapshot = await getDocs(collection(db, 'registration_requests'));
            const reqData = reqSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(reqData);

            const collegeSnapshot = await getDocs(collection(db, 'colleges'));

            setStats({
                pending: reqData.filter(r => r.status === 'pending').length,
                totalColleges: collegeSnapshot.size
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const generateCollegeCode = (name) => {
        return name.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 8);
    };

    const handleApprove = async (request) => {
        setProcessingId(request.id);
        try {
            const collegeCode = generateCollegeCode(request.collegeName);
            const collegeId = `col_${Date.now()}`;
            const tempPassword = `PN@${Math.floor(1000 + Math.random() * 9000)}`;

            // 1. Create College Record
            await setDoc(doc(db, 'colleges', collegeId), {
                id: collegeId,
                code: collegeCode,
                name: request.collegeName,
                location: request.collegeAddress,
                type: request.collegeType,
                settings: {
                    working_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                    periods_per_day: 8,
                    lunch_after_period: 4,
                    study_hour_period: 8
                },
                created_at: new Date()
            });

            // 2. Create Initial Admin Auth Account via Backend
            const response = await fetch('http://localhost:5000/api/admin/create-auth-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: `admin_${collegeId}`,
                    email: request.officialEmail,
                    password: tempPassword,
                    name: request.contactPerson,
                    role: 'admin',
                    collegeId: collegeId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create auth user');
            }

            // 3. Create Admin Record in Firestore
            await setDoc(doc(db, 'admins', `admin_${collegeId}`), {
                uid: `admin_${collegeId}`,
                name: request.contactPerson,
                email: request.officialEmail,
                college_id: collegeId,
                role: 'admin',
                must_change_password: true,
                created_at: new Date()
            });

            // 4. Update Request Status
            await updateDoc(doc(db, 'registration_requests', request.id), {
                status: 'approved',
                college_code: collegeCode
            });

            console.log(`APPROVED: ${request.collegeName}`);
            console.log(`COLLEGE CODE: ${collegeCode}`);
            console.log(`ADMIN EMAIL: ${request.officialEmail}`);
            console.log(`TEMP PASSWORD: ${tempPassword}`);
            alert(`Approved!\nCode: ${collegeCode}\nAdmin: ${request.officialEmail}\nTemp Pass: ${tempPassword}\n(Details logged to console)`);

            await fetchData();
        } catch (error) {
            console.error(error);
            alert('Approval failed.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Are you sure you want to reject this request?')) return;
        setProcessingId(id);
        try {
            await deleteDoc(doc(db, 'registration_requests', id));
            await fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Platform Command Center</h1>
                <p className="text-gray-500">Manage institute onboarding and platform health</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <div className="modern-card p-6 bg-blue-50 border-blue-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500 text-white rounded-xl"><Building size={24} /></div>
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Total Colleges</p>
                            <h3 className="text-2xl font-bold text-blue-900">{stats.totalColleges}</h3>
                        </div>
                    </div>
                </div>
                <div className="modern-card p-6 bg-amber-50 border-amber-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500 text-white rounded-xl"><Users size={24} /></div>
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Pending Requests</p>
                            <h3 className="text-2xl font-bold text-amber-900">{stats.pending}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Mail size={20} className="text-indigo-600" />
                        Pending Onboarding Requests
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence>
                        {requests.filter(r => r.status === 'pending').map((request) => (
                            <motion.div
                                key={request.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="modern-card p-6 bg-white shadow-sm border border-gray-100"
                            >
                                <div className="flex flex-wrap lg:flex-nowrap gap-6 items-start justify-between">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-gray-900">{request.collegeName}</h3>
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase">
                                                {request.collegeType}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-gray-400" />
                                                <span>{request.contactPerson} ({request.contactRole})</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-gray-400" />
                                                <span>{request.officialEmail}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone size={16} className="text-gray-400" />
                                                <span>{request.phoneNumber}</span>
                                            </div>
                                            <div className="flex items-center gap-2 lg:col-span-2">
                                                <Building size={16} className="text-gray-400" />
                                                <span>{request.collegeAddress}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-gray-400" />
                                                <span>Est. {request.studentCount} students</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleReject(request.id)}
                                            disabled={processingId === request.id}
                                            className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors flex items-center gap-2"
                                        >
                                            <X size={18} />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(request)}
                                            disabled={processingId === request.id}
                                            className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold shadow-lg shadow-green-100 transition-all flex items-center gap-2"
                                        >
                                            {processingId === request.id ? <Loader2 className="animate-spin" /> : <Check size={18} />}
                                            Approve & Initialize
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {requests.filter(r => r.status === 'pending').length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Shield size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">All clear! No pending registration requests.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default SuperAdminDashboard;
