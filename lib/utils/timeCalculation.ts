import type { Activity } from '../types/itinerary';

// Duration mappings in minutes by emoji
export const ACTIVITY_DURATIONS: Record<string, number> = {
  // Meals
  '☕': 45,      // Coffee
  '🥐': 45,      // Breakfast/Bakery
  '🍳': 45,      // Breakfast
  '🍜': 90,      // Lunch/Ramen/Noodles
  '🍱': 60,      // Bento (quicker lunch)
  '🍽️': 90,      // Restaurant
  '🍣': 120,     // Sushi/Fine dining
  '🍺': 90,      // Izakaya/Nightlife
  '🍷': 90,      // Wine bar

  // Activities
  '⛩️': 90,      // Temple/Shrine
  '🏛️': 90,      // Museum
  '🎨': 90,      // Art Gallery
  '🛍️': 60,      // Shopping
  '🎮': 60,      // Entertainment
  '💆': 90,      // Spa
  '🌳': 60,      // Park/Garden
  '🌆': 45,      // Viewpoint
  '🏨': 30,      // Hotel check-in
  '🚶': 45,      // Walking tour
  '📸': 45,      // Photo spot
};

export const DEFAULT_DURATION = 60; // minutes
export const TRAVEL_BUFFER = 15; // minutes between activities
export const DEFAULT_DAY_START = '9:00 AM';

/**
 * Parse time string to minutes from midnight
 * e.g., "9:00 AM" -> 540, "2:30 PM" -> 870
 */
export function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 540; // Default to 9:00 AM

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to time string
 * e.g., 540 -> "9:00 AM", 870 -> "2:30 PM"
 */
export function minutesToTimeString(totalMinutes: number): string {
  // Handle overflow past midnight
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;

  const hours24 = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;

  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get duration for an activity based on its emoji
 */
export function getActivityDuration(emoji: string): number {
  return ACTIVITY_DURATIONS[emoji] || DEFAULT_DURATION;
}

/**
 * Recalculate times for all activities in a day
 * Returns activities with updated time fields
 */
export function recalculateDayTimes<T extends { emoji: string; time: string }>(
  activities: T[],
  dayStartTime: string = DEFAULT_DAY_START
): T[] {
  if (activities.length === 0) return activities;

  let currentTime = parseTimeToMinutes(dayStartTime);

  return activities.map((activity) => {
    const newTime = minutesToTimeString(currentTime);
    const duration = getActivityDuration(activity.emoji);

    // Add activity duration plus travel buffer for next activity
    currentTime += duration + TRAVEL_BUFFER;

    return {
      ...activity,
      time: newTime,
    };
  });
}

/**
 * Recalculate times for Activity objects specifically
 * Also updates sortOrder to match array position
 */
export function recalculateActivityTimes(
  activities: Activity[],
  dayStartTime: string = DEFAULT_DAY_START
): Activity[] {
  if (activities.length === 0) return activities;

  let currentTime = parseTimeToMinutes(dayStartTime);

  return activities.map((activity, index) => {
    const newTime = minutesToTimeString(currentTime);
    const duration = getActivityDuration(activity.emoji);

    // Add activity duration plus travel buffer for next activity
    currentTime += duration + TRAVEL_BUFFER;

    return {
      ...activity,
      time: newTime,
      sortOrder: index,
    };
  });
}
