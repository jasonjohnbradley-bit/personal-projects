import type { GeneratedItinerary } from '../types/itinerary';

/** Normalize price to standard $ format */
export function normalizePrice(price: string | undefined | null): string | undefined {
  if (!price) return undefined;
  const priceStr = String(price).trim();
  if (priceStr.toLowerCase() === 'free') return 'Free';

  // Count any currency symbols (¥, $, €, £, etc.)
  const symbolCount = (priceStr.match(/[$¥€£₹₩]/g) || []).length;
  if (symbolCount === 0) return undefined;

  return '$'.repeat(Math.min(symbolCount, 4));
}

/** Normalize rating to X.X format */
export function normalizeRating(rating: string | undefined | null): string | undefined {
  if (!rating) return undefined;
  const ratingStr = String(rating).trim();
  if (ratingStr.toLowerCase() === 'n/a') return 'N/A';

  const num = parseFloat(ratingStr);
  if (isNaN(num)) return undefined;

  return Math.max(1.0, Math.min(5.0, num)).toFixed(1);
}

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

    // Normalize all activities (standardize price/rating formats)
    for (const day of parsed.days) {
      day.activities = day.activities.map((a: Record<string, unknown>) => ({
        ...a,
        rating: normalizeRating(a.rating as string | undefined),
        price: normalizePrice(a.price as string | undefined),
      }));
      day.alternatives = day.alternatives.map((a: Record<string, unknown>) => ({
        ...a,
        rating: normalizeRating(a.rating as string | undefined),
        price: normalizePrice(a.price as string | undefined),
      }));
    }

    // Normalize location ratings
    parsed.locations = parsed.locations.map((loc: Record<string, unknown>) => ({
      ...loc,
      rating: normalizeRating(loc.rating as string | undefined),
    }));

    return parsed as GeneratedItinerary;
  } catch (error) {
    console.error('Failed to parse itinerary response:', error);
    console.error('Raw response:', response.substring(0, 500));
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
