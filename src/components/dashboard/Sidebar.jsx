import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const location = useLocation();

    const navigation = [
        { name: 'Overview', href: '/dashboard', icon: '📊' },
        { name: 'Feedback', href: '/dashboard/feedback', icon: '💬' },
        { name: 'Analytics', href: '/dashboard/analytics', icon: '📈' },
        { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
    ];

    return (
        <div className="hidden md:flex md:flex-shrink-0">
            <div className="flex flex-col w-64">
                {/* Sidebar Header */}
                <div className="flex flex-col h-0 flex-1 bg-[#5A3E00]">
                    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                        <div className="flex items-center flex-shrink-0 px-4">
                            <h1 className="text-white text-xl font-bold">Milea Dashboard</h1>
                        </div>
                        
                        {/* Navigation */}
                        <nav className="mt-5 flex-1 px-2 space-y-1">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                            isActive
                                                ? 'bg-[#4A2E00] text-white'
                                                : 'text-gray-300 hover:bg-[#4A2E00] hover:text-white'
                                        }`}
                                    >
                                        <span className="mr-3">{item.icon}</span>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar; 