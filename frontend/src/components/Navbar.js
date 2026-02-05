import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut } from 'lucide-react';

const Navbar = () => {
    const { userData, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <div className="nav-logo-box">
                    <img src="/campusnet-logo.jpg" alt="Logo" />
                </div>
                <span>CampusNet</span>
            </div>

            <div className="navbar-user">
                {userData && (
                    <div className="user-info">
                        <div className="user-name">{userData.name}</div>
                        <div className="user-role">{userData.role}</div>
                    </div>
                )}
                <button className="btn btn-icon notification-btn" style={{ marginRight: '0.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    <span className="notification-badge"></span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
