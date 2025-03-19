import React, { useState } from 'react';
import api from '../services/apiService';

const SmsContactCard = ({ onClose, onSuccess }) => {
  // State for form inputs
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthdate: '',
    email: '',
    phoneNumber: '',
    message: ''
  });
  
  // State for form status
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [error, setError] = useState('');
  
  // State for terms acknowledgment
  const [termsAcknowledged, setTermsAcknowledged] = useState(false);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (e) => {
    setTermsAcknowledged(e.target.checked);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
      setError('First name, last name, and phone number are required.');
      return;
    }
    
    // Validate phone number format
    const phonePattern = /^\+?[1-9]\d{9,14}$/;
    if (!phonePattern.test(formData.phoneNumber.replace(/\D/g, ''))) {
      setError('Please enter a valid phone number.');
      return;
    }
    
    // Validate terms acknowledgment
    if (!termsAcknowledged) {
      setError('You must acknowledge the terms to proceed.');
      return;
    }
    
    setStatus('submitting');
    setError('');
    
    try {
      // Generate a unique session ID for this conversation
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Submit the form data
      const response = await api.post('/api/twilio/initiate', {
        ...formData,
        sessionId
      });
      
      if (response.data.success) {
        setStatus('success');
        
        // Send successful contact information to parent component
        if (onSuccess) {
          onSuccess({
            phoneNumber: response.data.phoneNumber,
            history: response.data.history,
            sessionId
          });
        }
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          birthdate: '',
          email: '',
          phoneNumber: '',
          message: ''
        });
        setTermsAcknowledged(false);
        
        // Close the form after a short delay
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || err.message || 'An error occurred while sending your message');
    }
  };
  
  // Component for showing terms & conditions
  const TermsAndConditions = () => (
    <div className="mt-2 text-xs text-amber-800 bg-amber-50 p-2 rounded">
      <p className="mb-1">
        By submitting this form, you give Milea Family Wines permission to send text messages with info, promotions, 
        and offers to the number you provided, including use of an automated system, even if that number is listed 
        on any do not call list. Consent is not a condition of purchase. Texts are recorded. Message and/or data 
        rates may apply. Use is subject to <a href="/terms.html" target="_blank" className="underline">Terms</a> with 
        an arbitration clause and a <a href="/privacy.html" target="_blank" className="underline">Privacy Policy</a>.
      </p>
    </div>
  );
  
  return (
    <div className="w-full p-4 bg-amber-50 rounded-lg shadow-md border border-amber-300">
      <h3 className="text-xl font-bold text-amber-900 mb-3">Text Us</h3>
      
      {status === 'success' ? (
        <div className="text-green-700 font-medium bg-green-50 p-3 rounded-lg">
          <p>Thanks for reaching out! We've received your message and will respond shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-amber-800 text-sm font-medium mb-1">First Name*</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full p-2 border border-amber-300 rounded bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-amber-800 text-sm font-medium mb-1">Last Name*</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full p-2 border border-amber-300 rounded bg-white"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-amber-800 text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-amber-300 rounded bg-white"
              />
            </div>
            <div>
              <label className="block text-amber-800 text-sm font-medium mb-1">Phone Number*</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full p-2 border border-amber-300 rounded bg-white"
                placeholder="e.g., +15551234567"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-amber-800 text-sm font-medium mb-1">Birthdate</label>
            <input
              type="date"
              name="birthdate"
              value={formData.birthdate}
              onChange={handleChange}
              className="w-full p-2 border border-amber-300 rounded bg-white"
            />
          </div>
          
          <div>
            <label className="block text-amber-800 text-sm font-medium mb-1">Message*</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border border-amber-300 rounded bg-white"
              required
            ></textarea>
          </div>
          
          <div className="flex items-start mt-2">
            <input
              type="checkbox"
              id="terms"
              checked={termsAcknowledged}
              onChange={handleCheckboxChange}
              className="mt-1 mr-2"
              required
            />
            <label htmlFor="terms" className="text-sm text-amber-800">
              I understand and agree to the terms and conditions
            </label>
          </div>
          
          <TermsAndConditions />
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-amber-900 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800 flex items-center"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SmsContactCard; 