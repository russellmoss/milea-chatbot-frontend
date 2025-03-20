import React from 'react';

const MainContent = ({ children }) => {
    return (
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                    {children}
                </div>
            </div>
        </main>
    );
};

export default MainContent; 