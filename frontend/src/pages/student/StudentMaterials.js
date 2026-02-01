import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { FileText, Download, Search } from 'lucide-react';

const StudentMaterials = () => {
    const { userData } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchMaterials = async () => {
            if (!userData?.college_id || !userData?.class_id) return;

            try {
                const matsQuery = query(
                    collection(db, 'materials'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', userData.class_id)
                );
                const snapshot = await getDocs(matsQuery);
                setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error('Error fetching materials:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, [userData]);

    const filteredMaterials = materials.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="loading"><div className="spinner"></div>Loading materials...</div>;
    }

    return (
        <div className="materials-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Study Materials</h1>
                    <p className="page-description">Access materials uploaded by your teachers.</p>
                </div>
            </div>

            <div className="filters" style={{ marginBottom: '1rem' }}>
                <div className="filter-group" style={{ flex: 1, maxWidth: '300px' }}>
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by title or subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filteredMaterials.length === 0 ? (
                <div className="empty-state">
                    <FileText size={40} />
                    <p>No materials available yet.</p>
                </div>
            ) : (
                <div className="materials-grid">
                    {filteredMaterials.map(material => (
                        <div key={material.id} className="card material-card">
                            <div className="material-icon">
                                <FileText size={24} />
                            </div>
                            <div className="material-info">
                                <h4 style={{ marginBottom: '0.25rem' }}>{material.title}</h4>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                    {material.subject}
                                </p>
                                {material.description && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        {material.description.substring(0, 80)}...
                                    </p>
                                )}
                                <span className="badge badge-secondary">{material.file_type?.toUpperCase()}</span>
                            </div>
                            {material.file_url && (
                                <a
                                    href={material.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary btn-sm"
                                    style={{ marginTop: '1rem' }}
                                >
                                    <Download size={14} /> Download
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .materials-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1rem;
                }
                .material-card {
                    display: flex;
                    flex-direction: column;
                }
                .material-icon {
                    width: 48px;
                    height: 48px;
                    background-color: rgba(99, 102, 241, 0.15);
                    border-radius: var(--border-radius);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--accent-primary);
                    margin-bottom: 1rem;
                }
            `}</style>
        </div>
    );
};

export default StudentMaterials;
