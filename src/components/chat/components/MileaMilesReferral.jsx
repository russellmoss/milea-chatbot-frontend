import React from 'react';

/**
 * Component to display information about the Milea Miles referral program
 * with a link to the external portal
 */
const MileaMilesReferral = () => {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full bg-amber-50 rounded-lg shadow-md p-4 border border-amber-200">
        <h3 className="text-xl font-bold text-amber-900 mb-3">Milea Miles Referral Program</h3>
        <p className="mb-4 text-amber-800">
          You can send a free wine tasting to friends through our Milea Miles program!
        </p>
        <div className="flex justify-center">
          <a 
            href="https://miles.mileaestatevineyard.com/" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-amber-800 text-white py-2 px-6 rounded-md font-medium hover:bg-amber-900 transition-colors"
          >
            Access Milea Miles Portal →
          </a>
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-600">
        Log in with your Milea account or create a new one to start sending free tastings!
      </div>
    </div>
  );
};

export default MileaMilesReferral;