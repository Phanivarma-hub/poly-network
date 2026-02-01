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
                <GraduationCap size={28} />
                <span>Poly Network</span>
            </div>

            <div className="navbar-user">
                {userData && (
                    <div className="user-info">
                        <div className="user-name">{userData.name}</div>
                        <div className="user-role">{userData.role}</div>
                    </div>
                )}
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
