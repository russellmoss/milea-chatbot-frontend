import React, { useState } from 'react';
import { subscribeToMailingList } from '../services/apiService';

const MailingListSignup = ({ onClose, onSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!firstName || !lastName || !email) {
      setErrorMessage('All fields are required');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    
    setStatus('submitting');
    setErrorMessage('');
    
    try {
      const data = await subscribeToMailingList({
        firstName,
        lastName,
        email,
        emailMarketingStatus: 'Subscribed'
      });
      
      // Success handling
      setStatus('success');
      if (onSuccess) {
        // If we got isExisting flag, handle slightly differently
        if (data.isExisting) {
          onSuccess(`${email} is already on our mailing list! Your subscription preferences have been updated.`);
        } else {
          onSuccess(`${firstName} ${lastName} has been successfully subscribed to our mailing list!`);
        }
      }
      
      // Reset the form
      setFirstName('');
      setLastName('');
      setEmail('');
      
      // Auto-close after success if onClose is provided
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      setStatus('error');
      
      // Handle specific error responses
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 409) {
          // Already subscribed
          setStatus('success');
          if (onSuccess) {
            onSuccess(`${email} is already subscribed to our mailing list!`);
          }
          setTimeout(() => {
            if (onClose) onClose();
          }, 2000);
          return;
        }
        
        // Other error responses
        setErrorMessage(error.response.data?.message || 'An error occurred. Please try again.');
      } else if (error.request) {
        // The request was made but no response was received
        setErrorMessage('No response from server. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setErrorMessage('Network error. Please try again later.');
      }
      
      console.error('Subscription error:', error);
    }
  };

  return (
    <div className="bg-[#F9F4E9] rounded-lg p-4 shadow-md border border-[#715100]">
      <h3 className="text-[#5A3E00] text-lg font-bold mb-3">Join Our Mailing List</h3>
      
      {status === 'success' ? (
        <div className="text-green-600 font-medium py-2">
          Thank you for subscribing to our mailing list!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-2 border border-[#D8D1AE] rounded bg-white text-[#5A3E00]"
              disabled={status === 'submitting'}
            />
          </div>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 border border-[#D8D1AE] rounded bg-white text-[#5A3E00]"
              disabled={status === 'submitting'}
            />
          </div>
          <div className="mb-3">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-[#D8D1AE] rounded bg-white text-[#5A3E00]"
              disabled={status === 'submitting'}
            />
          </div>
          
          {errorMessage && (
            <div className="text-red-500 text-sm mb-2">{errorMessage}</div>
          )}
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded text-[#5A3E00] hover:bg-gray-300"
              disabled={status === 'submitting'}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#5A3E00] text-white rounded hover:bg-[#48320A]"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MailingListSignup;