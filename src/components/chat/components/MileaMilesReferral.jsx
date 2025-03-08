import React from 'react';

const MileaMilesReferral = () => {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold mb-3">Milea Miles Referral Program</h3>
        <p className="mb-4">
          To send a free tasting through our Milea Miles program, please visit our dedicated portal.
        </p>
        <a 
          href="https://miles.mileaestatevineyard.com/" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#715100] text-white py-2 px-4 rounded font-medium hover:bg-[#5A3E00] transition-colors"
        >
          Access Milea Miles
        </a>
      </div>
      <div className="mt-4 text-sm text-gray-600 italic">
        Log in or create an account to send free tastings to your friends and family!
      </div>
    </div>
  );
};

export default MileaMilesReferral;