/**
 * Helper function to check if a query is related to reservations
 * @param {string} query - The user's input query
 * @returns {boolean} - True if the query is about reservations
 */
export const isReservationQuery = (query) => {
  const reservationKeywords = [
    'reservation',
    'reserve',
    'book',
    'booking',
    'schedule',
    'appointment',
    'tasting',
    'visit',
    'come in',
    'walk in',
    'walk-in',
    'drop by',
    'drop in',
    'drop-in'
  ];

  return reservationKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
}; 