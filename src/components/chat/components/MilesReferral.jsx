import React from 'react';

const MilesReferral = ({ onClose }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto my-4">
      <h3 className="text-xl font-semibold text-[#5A3E00] mb-4">
        Join Milea Miles
      </h3>
      
      <p className="text-gray-700 mb-4">
        Earn points for every purchase and get exclusive rewards. Plus, you'll get 500 bonus points just for joining!
      </p>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#5A3E00] rounded-full"></div>
          <span className="text-gray-700">Free to join</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#5A3E00] rounded-full"></div>
          <span className="text-gray-700">Earn points on every purchase</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#5A3E00] rounded-full"></div>
          <span className="text-gray-700">Exclusive member-only events</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#5A3E00] rounded-full"></div>
          <span className="text-gray-700">Special birthday rewards</span>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A3E00]"
        >
          Maybe Later
        </button>
        <button
          onClick={() => window.open('/milea-miles', '_blank')}
          className="px-4 py-2 text-sm font-medium text-white bg-[#5A3E00] rounded-md hover:bg-[#3D2900] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A3E00]"
        >
          Join Now
        </button>
      </div>
    </div>
  );
};

export default MilesReferral; 