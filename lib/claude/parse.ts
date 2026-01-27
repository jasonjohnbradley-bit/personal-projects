import type { GeneratedItinerary } from '../types/itinerary';

export function parseItineraryResponse(response: string): GeneratedItinerary {
  // Remove potential markdown code blocks
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Validate structure
    if (!parsed.days || !Array.isArray(parsed.days)) {
      throw new Error('Missing or invalid "days" array');
    }

    if (!parsed.locations || !Array.isArray(parsed.locations)) {
      throw new Error('Missing or invalid "locations" array');
    }

    // Validate each day
    for (const day of parsed.days) {
      if (typeof day.dayNumber !== 'number') {
        throw new Error('Day missing dayNumber');
      }
      if (!day.title) {
        throw new Error('Day missing title');
      }
      if (!Array.isArray(day.activities)) {
        throw new Error('Day missing activities array');
      }
      if (!Array.isArray(day.alternatives)) {
        day.alternatives = []; // Default to empty if missing
      }
    }

    // Validate locations
    for (const loc of parsed.locations) {
      if (!loc.name || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
        throw new Error('Invalid location data');
      }
    }

    return parsed as GeneratedItinerary;
  } catch (error) {
    console.error('Failed to parse itinerary response:', error);
    console.error('Raw response:', response.substring(0, 500));
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
