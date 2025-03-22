import { apiService } from './apiService';

class AnalyticsService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.messageCount = 0;
    this.interactionCount = 0;
    this.interactions = [];
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  async trackSessionEnd() {
    try {
      const endTime = new Date();
      const duration = Math.floor((endTime - this.startTime) / 1000); // Duration in seconds

      const sessionData = {
        sessionId: this.sessionId,
        userId: null, // Can be updated when user is authenticated
        timestamp: endTime.toISOString(),
        duration,
        messageCount: this.messageCount,
        interactionCount: this.interactionCount,
        interactions: this.interactions
      };

      await apiService.trackSessionMetrics(sessionData);
    } catch (error) {
      console.error('Error tracking session end:', error);
      // Don't throw the error to prevent blocking other functionality
    }
  }

  trackUserInteraction(eventType, eventData = {}) {
    this.interactionCount++;
    this.interactions.push({
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString()
    });
  }

  incrementMessageCount() {
    this.messageCount++;
  }
}

export const analyticsService = new AnalyticsService(); 