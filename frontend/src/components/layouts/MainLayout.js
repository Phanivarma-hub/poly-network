import React from 'react';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import '../../styles/styles.css';

const MainLayout = ({ children }) => {
    return (
        <div className="app-container">
            <Navbar />
            <div className="main-layout">
                <Sidebar />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
