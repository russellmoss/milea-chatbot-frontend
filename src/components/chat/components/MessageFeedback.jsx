import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/outline';
import { ThumbUpIcon, ThumbDownIcon } from '@heroicons/react/solid';
import api from '../../../services/api';

const MessageFeedback = ({ messageId, conversationId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuickFeedback = async (isPositive) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/api/feedback', {
        messageId,
        conversationId,
        rating: isPositive ? 5 : 2,
        tags: [isPositive ? 'helpful' : 'not_helpful']
      });

      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit feedback');
      console.error('Feedback submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDetailedFeedback = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.post('/api/feedback', {
        messageId,
        conversationId,
        rating,
        comment,
        tags
      });

      setSubmitted(true);
      setShowForm(false);
    } catch (err) {
      setError('Failed to submit feedback');
      console.error('Feedback submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag) => {
    setTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
        Thank you for your feedback!
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {!showForm && (
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => handleQuickFeedback(true)}
            disabled={loading}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600 transition-colors"
          >
            <ThumbUpIcon className="h-4 w-4" />
            <span>Helpful</span>
          </button>
          <button
            onClick={() => handleQuickFeedback(false)}
            disabled={loading}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <ThumbDownIcon className="h-4 w-4" />
            <span>Not Helpful</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Detailed Feedback
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleDetailedFeedback} className="space-y-3">
          <div className="flex items-center justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                {star <= rating ? (
                  <StarIcon className="h-6 w-6 text-yellow-400" />
                ) : (
                  <StarOutlineIcon className="h-6 w-6 text-gray-300 hover:text-yellow-400" />
                )}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Additional comments (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {['helpful', 'not_helpful', 'inaccurate', 'confusing', 'excellent', 'needs_improvement'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-2 py-1 text-sm rounded-full ${
                  tags.includes(tag)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag.replace('_', ' ')}
              </button>
            ))}
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={loading}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MessageFeedback; 