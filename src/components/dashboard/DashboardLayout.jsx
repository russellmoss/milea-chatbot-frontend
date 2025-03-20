import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MainContent from './MainContent';

const DashboardLayout = ({ children }) => {
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header />
                
                {/* Main Content */}
                <MainContent>
                    {children}
                </MainContent>
            </div>
        </div>
    );
};

export default DashboardLayout; 