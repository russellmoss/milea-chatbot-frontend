import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../../services/apiService';

const MessageFeedback = ({ messageId, conversationId, onSubmit, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!messageId) {
        throw new Error("Message ID is required");
      }

      if (!rating) {
        throw new Error("Please select a rating");
      }

      console.log('Submitting feedback for message:', messageId);
      console.log('Conversation ID:', conversationId);

      const feedbackData = {
        messageId: String(messageId),
        conversationId: String(conversationId),
        rating: Number(rating),
        comment: comment.trim() || null
      };

      console.log('Feedback data to submit:', feedbackData);

      const response = await apiService.submitFeedback(feedbackData);
      console.log('Feedback submission successful:', response);
      
      // Show success message
      setSubmitted(true);
      setComment("Thank you for your feedback!");
      
      // Call the onSubmit handler with the feedback data
      if (onSubmit) {
        onSubmit(feedbackData);
      }
      
      // Close after a delay
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setError(error.message || "Unable to submit feedback at this time. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
        {comment}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Rate this response</h3>
      <div className="flex items-center mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            {star <= rating ? (
              <StarIcon className="h-6 w-6 text-yellow-400" />
            ) : (
              <StarOutlineIcon className="h-6 w-6 text-gray-300" />
            )}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment (optional)"
        className="w-full p-2 border rounded mb-4"
        rows="3"
      />
      {error && (
        <div className="text-red-500 text-sm mb-4">
          {error}
        </div>
      )}
      <div className="flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || loading}
          className="px-4 py-2 bg-[#5A3E00] text-white rounded hover:bg-[#3D2900] disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default MessageFeedback; 