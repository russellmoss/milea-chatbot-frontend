import React, { useState, useEffect } from 'react';
import { submitWineClubMembership, checkExistingCustomer } from '../services/apiService';

const WineClubSignup = ({ preSelectedClub = null, onSubmit, onCancel }) => {
  // State for multi-step form
  const [step, setStep] = useState(preSelectedClub ? 1 : 0);
  const [formData, setFormData] = useState({
    // Club selection
    clubId: preSelectedClub?.id || '',
    clubName: preSelectedClub?.name || '',
    
    // Personal info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Password
    password: '',
    confirmPassword: '',
    
    // Shipping address
    shippingAddress: {
      address: '',
      address2: '',
      city: '',
      stateCode: '',
      zipCode: '',
      countryCode: 'US'
    },
    
    // Billing details
    billingAddressSame: true,
    billingAddress: {
      address: '',
      address2: '',
      city: '',
      stateCode: '',
      zipCode: '',
      countryCode: 'US'
    },
    
    // Preferences
    deliveryMethod: 'shipping' // 'shipping' or 'pickup'
  });
  
  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // Check for existing customer
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  
  // Club details
  const clubOptions = [
    { id: '2ba4f45e-51b9-45af-ab34-6162b9383948', name: 'Jumper', description: 'Our entry-level club with quarterly shipments of 3 bottles.' },
    { id: 'a708a00a-2bd6-4f5d-9ce6-e1e37b107808', name: 'Grand Prix', description: 'Mid-tier club with quarterly shipments of 6 bottles and exclusive access to limited releases.' },
    { id: '0a2dbd7e-656c-4cb9-a0c7-146187fccefe', name: 'Triple Crown', description: 'Premium club with quarterly shipments of 12 bottles and special member events.' }
  ];
  
  // Set preselected club if provided
  useEffect(() => {
    if (preSelectedClub) {
      const club = clubOptions.find(c => c.name.toLowerCase() === preSelectedClub.toLowerCase());
      if (club) {
        setFormData(prev => ({
          ...prev,
          clubId: club.id,
          clubName: club.name
        }));
      }
    }
  }, [preSelectedClub]);
  
  // US states for dropdown
  const states = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' }
  ];
  
  // Check for existing customer when email is entered
  useEffect(() => {
    const checkCustomer = async () => {
      if (formData.email && step === 1) {
        setIsCheckingCustomer(true);
        try {
          const customer = await checkExistingCustomer(formData.email);
          if (customer) {
            setIsExistingCustomer(true);
            // Pre-fill form with existing data
            setFormData(prev => ({
              ...prev,
              firstName: customer.firstName || prev.firstName,
              lastName: customer.lastName || prev.lastName,
              phone: customer.phone || prev.phone
            }));
          } else {
            setIsExistingCustomer(false);
          }
        } catch (error) {
          console.error('Error checking customer:', error);
        } finally {
          setIsCheckingCustomer(false);
        }
      }
    };

    checkCustomer();
  }, [formData.email, step]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear validation errors for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Handle address form input changes
  const handleAddressChange = (type, e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [type]: {
        ...prevData[type],
        [name]: value
      }
    }));
    
    // Clear validation errors for this field
    if (formErrors[`${type}.${name}`]) {
      setFormErrors({
        ...formErrors,
        [`${type}.${name}`]: null
      });
    }
  };
  
  // Handle club selection
  const handleClubSelect = (clubId, clubName) => {
    setFormData(prevData => ({
      ...prevData,
      clubId,
      clubName
    }));
    nextStep();
  };
  
  // Handle billing address checkbox
  const handleBillingAddressSame = (e) => {
    const isChecked = e.target.checked;
    setFormData(prevData => ({
      ...prevData,
      billingAddressSame: isChecked,
      // If checked, copy shipping address to billing address
      ...(isChecked && { billingAddress: { ...prevData.shippingAddress } })
    }));
  };
  
  // Handle delivery method selection
  const handleDeliveryMethod = (method) => {
    setFormData(prevData => ({
      ...prevData,
      deliveryMethod: method
    }));
  };
  
  // Validate form data before proceeding to next step
  const validateCurrentStep = () => {
    const errors = {};
    
    switch (step) {
      case 0: // Club selection
        if (!formData.clubId) {
          errors.clubId = 'Please select a club';
        }
        break;
        
      case 1: // Personal info
        if (!formData.firstName.trim()) {
          errors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
          errors.lastName = 'Last name is required';
        }
        if (!formData.email.trim()) {
          errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          errors.email = 'Please enter a valid email';
        }
        if (!formData.phone.trim()) {
          errors.phone = 'Phone number is required';
        }
        break;
        
      case 2: // Password creation
        if (!formData.password) {
          errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          errors.password = 'Password must be at least 8 characters long';
        }
        
        if (!formData.confirmPassword) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 3: // Shipping address
        if (!formData.shippingAddress.address.trim()) {
          errors['shippingAddress.address'] = 'Address is required';
        }
        if (!formData.shippingAddress.city.trim()) {
          errors['shippingAddress.city'] = 'City is required';
        }
        if (!formData.shippingAddress.stateCode) {
          errors['shippingAddress.stateCode'] = 'State is required';
        }
        if (!formData.shippingAddress.zipCode.trim()) {
          errors['shippingAddress.zipCode'] = 'ZIP code is required';
        }
        break;
        
      case 4: // Billing address (only if not same as shipping)
        if (!formData.billingAddressSame) {
          if (!formData.billingAddress.address.trim()) {
            errors['billingAddress.address'] = 'Address is required';
          }
          if (!formData.billingAddress.city.trim()) {
            errors['billingAddress.city'] = 'City is required';
          }
          if (!formData.billingAddress.stateCode) {
            errors['billingAddress.stateCode'] = 'State is required';
          }
          if (!formData.billingAddress.zipCode.trim()) {
            errors['billingAddress.zipCode'] = 'ZIP code is required';
          }
        }
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Submit to our API endpoint
      const response = await submitWineClubMembership(formData);
      
      // Handle successful submission
      setSubmissionComplete(true);
      setStep(step + 1);
      
      // Call the onSubmit callback
      if (onSubmit) {
        onSubmit({
          clubName: formData.clubName,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'There was an error submitting your application. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Navigation functions
  const nextStep = () => {
    if (validateCurrentStep()) {
      // Skip billing address step if same as shipping
      if (step === 3 && formData.billingAddressSame) {
        setStep(step + 2);
      } else {
        setStep(step + 1);
      }
    }
  };
  
  const prevStep = () => {
    // If coming back from billing and billing is same as shipping, go back to shipping
    if (step === 5 && formData.billingAddressSame) {
      setStep(3);
    } else {
      setStep(step - 1);
    }
  };
  
  // Render functions for each step
  const renderClubSelection = () => (
    <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
      <h3 className="text-xl font-bold text-amber-900 mb-4">Select Your Wine Club Level</h3>
      
      <div className="space-y-4">
        {clubOptions.map(club => (
          <div 
            key={club.id}
            className="p-4 border border-amber-200 rounded-lg hover:border-amber-500 cursor-pointer transition-colors"
            onClick={() => handleClubSelect(club.id, club.name)}
          >
            <h4 className="text-lg font-semibold text-amber-800">{club.name} Club</h4>
            <p className="text-amber-700">{club.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderPersonalInfo = () => (
    <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
      <h3 className="text-xl font-bold text-amber-900 mb-4">Your Information</h3>
      <p className="text-amber-700 mb-4">You selected the <span className="font-semibold">{formData.clubName} Club</span></p>
      
      {isExistingCustomer && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-blue-700">We found an existing account with this email. Your information has been pre-filled.</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-amber-800 mb-1">First Name*</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full p-2 border ${formErrors.firstName ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
            required
          />
          {formErrors.firstName && (
            <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-amber-800 mb-1">Last Name*</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full p-2 border ${formErrors.lastName ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
            required
          />
          {formErrors.lastName && (
            <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-amber-800 mb-1">Email*</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full p-2 border ${formErrors.email ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
            required
          />
          {formErrors.email && (
            <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-amber-800 mb-1">Phone*</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full p-2 border ${formErrors.phone ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
            required
          />
          {formErrors.phone && (
            <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          className="px-4 py-2 border border-amber-300 text-amber-800 rounded hover:bg-amber-100"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          className="px-4 py-2 bg-amber-800 text-white rounded hover:bg-amber-900"
        >
          Continue
        </button>
      </div>
    </div>
  );
  
  const renderPasswordCreation = () => (
    <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
      <h3 className="text-xl font-bold text-amber-900 mb-4">Create Your Account</h3>
      
      <div className="mb-4">
        <p className="text-amber-700">
          Please create a password for your Commerce7 account. This will allow you to log in and manage your wine club membership in the future.
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-amber-800 mb-1">Password*</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-2 pr-10 border ${formErrors.password ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
              required
              placeholder="Create a password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-amber-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
          {formErrors.password && (
            <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
          )}
        </div>
        
        <div>
          <label className="block text-amber-800 mb-1">Confirm Password*</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full p-2 pr-10 border ${formErrors.confirmPassword ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
              required
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-amber-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
          {formErrors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          className="px-4 py-2 border border-amber-300 text-amber-800 rounded hover:bg-amber-100"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          className="px-4 py-2 bg-amber-800 text-white rounded hover:bg-amber-900"
        >
          Continue
        </button>
      </div>
    </div>
  );
  
  const renderShippingAddress = () => (
    <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
      <h3 className="text-xl font-bold text-amber-900 mb-4">Shipping Address</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-amber-800 mb-1">Address Line 1*</label>
          <input
            type="text"
            name="address"
            value={formData.shippingAddress.address}
            onChange={(e) => handleAddressChange('shippingAddress', e)}
            className={`w-full p-2 border ${formErrors['shippingAddress.address'] ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
            required
          />
          {formErrors['shippingAddress.address'] && (
            <p className="text-red-500 text-sm mt-1">{formErrors['shippingAddress.address']}</p>
          )}
        </div>
        
        <div>
          <label className="block text-amber-800 mb-1">Address Line 2 (Optional)</label>
          <input
            type="text"
            name="address2"
            value={formData.shippingAddress.address2}
            onChange={(e) => handleAddressChange('shippingAddress', e)}
            className="w-full p-2 border border-amber-200 rounded bg-white"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-amber-800 mb-1">City*</label>
            <input
              type="text"
              name="city"
              value={formData.shippingAddress.city}
              onChange={(e) => handleAddressChange('shippingAddress', e)}
              className={`w-full p-2 border ${formErrors['shippingAddress.city'] ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
              required
            />
            {formErrors['shippingAddress.city'] && (
              <p className="text-red-500 text-sm mt-1">{formErrors['shippingAddress.city']}</p>
            )}
          </div>
          
          <div>
            <label className="block text-amber-800 mb-1">State*</label>
            <select
              name="stateCode"
              value={formData.shippingAddress.stateCode}
              onChange={(e) => handleAddressChange('shippingAddress', e)}
              className={`w-full p-2 border ${formErrors['shippingAddress.stateCode'] ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
              required
            >
              <option value="">Select State</option>
              {states.map(state => (
                <option key={state.code} value={state.code}>{state.name}</option>
              ))}
            </select>
            {formErrors['shippingAddress.stateCode'] && (
              <p className="text-red-500 text-sm mt-1">{formErrors['shippingAddress.stateCode']}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-amber-800 mb-1">ZIP Code*</label>
            <input
              type="text"
              name="zipCode"
              value={formData.shippingAddress.zipCode}
              onChange={(e) => handleAddressChange('shippingAddress', e)}
              className={`w-full p-2 border ${formErrors['shippingAddress.zipCode'] ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
              required
            />
            {formErrors['shippingAddress.zipCode'] && (
              <p className="text-red-500 text-sm mt-1">{formErrors['shippingAddress.zipCode']}</p>
            )}
          </div>
          
          <div>
            <label className="block text-amber-800 mb-1">Country*</label>
            <select
              name="countryCode"
              value={formData.shippingAddress.countryCode}
              onChange={(e) => handleAddressChange('shippingAddress', e)}
              className="w-full p-2 border border-amber-200 rounded bg-white"
              required
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="flex items-center text-amber-800">
            <input
              type="checkbox"
              checked={formData.billingAddressSame}
              onChange={handleBillingAddressSame}
              className="mr-2"
            />
            Billing address same as shipping
          </label>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          className="px-4 py-2 border border-amber-300 text-amber-800 rounded hover:bg-amber-100"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          className="px-4 py-2 bg-amber-800 text-white rounded hover:bg-amber-900"
        >
          Continue
        </button>
      </div>
    </div>
  );
  
  const renderBillingAddress = () => {
    // Skip if billing is same as shipping
    if (formData.billingAddressSame) {
      nextStep();
      return null;
    }
    
    return (
      <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
        <h3 className="text-xl font-bold text-amber-900 mb-4">Billing Address</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-amber-800 mb-1">Address Line 1*</label>
            <input
              type="text"
              name="address"
              value={formData.billingAddress.address}
              onChange={(e) => handleAddressChange('billingAddress', e)}
              className={`w-full p-2 border ${formErrors['billingAddress.address'] ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
              required
            />
            {formErrors['billingAddress.address'] && (
              <p className="text-red-500 text-sm mt-1">{formErrors['billingAddress.address']}</p>
            )}
          </div>
          
          <div>
            <label className="block text-amber-800 mb-1">Address Line 2 (Optional)</label>
            <input
              type="text"
              name="address2"
              value={formData.billingAddress.address2}
              onChange={(e) => handleAddressChange('billingAddress', e)}
              className="w-full p-2 border border-amber-200 rounded bg-white"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-800 mb-1">City*</label>
              <input
                type="text"
                name="city"
                value={formData.billingAddress.city}
                onChange={(e) => handleAddressChange('billingAddress', e)}
                className={`w-full p-2 border ${formErrors['billingAddress.city'] ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
                required
              />
              {formErrors['billingAddress.city'] && (
                <p className="text-red-500 text-sm mt-1">{formErrors['billingAddress.city']}</p>
              )}
            </div>
            
            <div>
              <label className="block text-amber-800 mb-1">State*</label>
              <select
                name="stateCode"
                value={formData.billingAddress.stateCode}
                onChange={(e) => handleAddressChange('billingAddress', e)}
                className={`w-full p-2 border ${formErrors['billingAddress.stateCode'] ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
                required
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state.code} value={state.code}>{state.name}</option>
                ))}
              </select>
              {formErrors['billingAddress.stateCode'] && (
                <p className="text-red-500 text-sm mt-1">{formErrors['billingAddress.stateCode']}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-800 mb-1">ZIP Code*</label>
              <input
                type="text"
                name="zipCode"
                value={formData.billingAddress.zipCode}
                onChange={(e) => handleAddressChange('billingAddress', e)}
                className={`w-full p-2 border ${formErrors['billingAddress.zipCode'] ? 'border-red-400' : 'border-amber-200'} rounded bg-white`}
                required
              />
              {formErrors['billingAddress.zipCode'] && (
                <p className="text-red-500 text-sm mt-1">{formErrors['billingAddress.zipCode']}</p>
              )}
            </div>
            
            <div>
              <label className="block text-amber-800 mb-1">Country*</label>
              <select
                name="countryCode"
                value={formData.billingAddress.countryCode}
                onChange={(e) => handleAddressChange('billingAddress', e)}
                className="w-full p-2 border border-amber-200 rounded bg-white"
                required
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            className="px-4 py-2 border border-amber-300 text-amber-800 rounded hover:bg-amber-100"
          >
            Back
          </button>
          <button
            onClick={nextStep}
            className="px-4 py-2 bg-amber-800 text-white rounded hover:bg-amber-900"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };
  
  const renderDeliveryPreference = () => (
    <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
      <h3 className="text-xl font-bold text-amber-900 mb-4">Delivery Preference</h3>
      
      <div className="space-y-4">
        <div 
          className={`p-4 border ${formData.deliveryMethod === 'shipping' ? 'border-amber-500 bg-amber-100' : 'border-amber-200'} rounded-lg cursor-pointer`}
          onClick={() => handleDeliveryMethod('shipping')}
        >
          <div className="flex items-start">
            <div className={`w-6 h-6 rounded-full border ${formData.deliveryMethod === 'shipping' ? 'border-amber-500 bg-amber-500' : 'border-amber-300'} flex items-center justify-center mr-3 mt-1`}>
              {formData.deliveryMethod === 'shipping' && (
                <div className="w-3 h-3 rounded-full bg-white"></div>
              )}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-amber-800">Ship to My Address</h4>
              <p className="text-amber-700">Have your wine club shipments delivered directly to your door.</p>
            </div>
          </div>
        </div>
        
        <div 
          className={`p-4 border ${formData.deliveryMethod === 'pickup' ? 'border-amber-500 bg-amber-100' : 'border-amber-200'} rounded-lg cursor-pointer`}
          onClick={() => handleDeliveryMethod('pickup')}
        >
          <div className="flex items-start">
            <div className={`w-6 h-6 rounded-full border ${formData.deliveryMethod === 'pickup' ? 'border-amber-500 bg-amber-500' : 'border-amber-300'} flex items-center justify-center mr-3 mt-1`}>
              {formData.deliveryMethod === 'pickup' && (
                <div className="w-3 h-3 rounded-full bg-white"></div>
              )}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-amber-800">Pickup at Winery</h4>
              <p className="text-amber-700">Pick up your wine club shipments at Milea Estate Vineyard. Enjoy complimentary tastings during pickup!</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          className="px-4 py-2 border border-amber-300 text-amber-800 rounded hover:bg-amber-100"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-amber-800 text-white rounded hover:bg-amber-900 flex items-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Submit Application'
          )}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
  
  const renderConfirmation = () => (
    <div className="space-y-4 p-4 bg-amber-50 rounded-lg text-center">
      <div className="flex justify-center mb-4 text-amber-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h3 className="text-xl font-bold text-amber-900 mb-4">Thank You for Joining!</h3>
      
      <p className="text-amber-700 mb-2">
        Your membership in the <span className="font-semibold">{formData.clubName} Club</span> is pending.
      </p>
      
      <p className="text-amber-700 mb-4">
        A member of our team will call you at {formData.phone} to finalize your membership. 
        You're now part of the Milea Family!
      </p>
      
      <div className="p-4 bg-amber-100 rounded-lg inline-block">
        <p className="text-amber-800 font-medium">Reference: #{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
      </div>
    </div>
  );
  
  // Render the appropriate step
  const renderStep = () => {
    switch (step) {
      case 0:
        return renderClubSelection();
      case 1:
        return renderPersonalInfo();
      case 2:
        return renderPasswordCreation();
      case 3:
        return renderShippingAddress();
      case 4:
        return renderBillingAddress();
      case 5:
        return renderDeliveryPreference();
      case 6:
        return renderConfirmation();
      default:
        return renderClubSelection();
    }
  };
  
  return (
    <div className="max-w-lg mx-auto">
      {/* Progress bar */}
      {step < 6 && (
        <div className="mb-6">
          <div className="h-2 bg-amber-100 rounded-full">
            <div 
              className="h-2 bg-amber-500 rounded-full transition-all duration-300" 
              style={{ width: `${(step / 6) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-amber-600 mt-2">
            <span>Club</span>
            <span>Info</span>
            <span>Password</span>
            <span>Address</span>
            <span>Preferences</span>
          </div>
        </div>
      )}
      
      {/* Step content */}
      {renderStep()}
      
      {/* Cancel button */}
      {step < 6 && (
        <div className="text-center mt-4">
          <button 
            onClick={onCancel} 
            className="text-amber-700 hover:text-amber-900 text-sm"
          >
            Cancel signup
          </button>
        </div>
      )}
    </div>
  );
};

export default WineClubSignup;