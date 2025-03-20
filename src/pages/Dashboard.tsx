import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h1 className="text-2xl font-semibold text-gray-900">Welcome to Milea Dashboard</h1>
            <p className="mt-2 text-gray-600">
              This is your central hub for managing feedback and analytics.
            </p>
            <button
              onClick={logout}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-milea hover:bg-milea-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-milea"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 