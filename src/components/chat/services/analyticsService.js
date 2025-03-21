import { trackInteraction, trackSessionMetrics } from './apiService';

class AnalyticsService {
  constructor() {
    this.sessionStartTime = Date.now();
    this.messageCount = 0;
    this.interactions = [];
  }

  /**
   * Track a user interaction
   * @param {string} type - Type of interaction (e.g., 'message_sent', 'button_clicked')
   * @param {Object} details - Additional details about the interaction
   */
  trackUserInteraction(type, details = {}) {
    const interaction = {
      type,
      timestamp: Date.now(),
      ...details
    };

    this.interactions.push(interaction);
    trackInteraction(interaction).catch(console.error);
  }

  /**
   * Track a message being sent
   * @param {string} message - The message content
   * @param {string} role - The role of the sender ('user' or 'bot')
   */
  trackMessage(message, role) {
    this.messageCount++;
    this.trackUserInteraction('message_sent', {
      message,
      role,
      messageCount: this.messageCount
    });
  }

  /**
   * Track session metrics when the chat is closed
   */
  trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    trackSessionMetrics({
      duration: sessionDuration,
      messageCount: this.messageCount,
      interactionCount: this.interactions.length,
      interactions: this.interactions
    }).catch(console.error);
  }

  /**
   * Track feedback submission
   * @param {number} rating - User's rating (1-5)
   * @param {string} comment - User's feedback comment
   */
  trackFeedback(rating, comment) {
    this.trackUserInteraction('feedback_submitted', {
      rating,
      comment
    });
  }
}

export const analyticsService = new AnalyticsService(); 