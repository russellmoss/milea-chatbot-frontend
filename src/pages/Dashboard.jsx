import React from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';

const Dashboard = () => {
    return (
        <DashboardLayout>
            <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-semibold text-gray-900">Welcome to Milea Dashboard</h1>
                <p className="mt-2 text-gray-600">
                    This is your central hub for managing feedback, analytics, and settings.
                </p>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard; 