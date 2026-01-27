import type { Day, Location, Activity } from '../types/itinerary';

// Category colors matching the Ghibli theme
const CATEGORY_COLORS: Record<string, string> = {
  'Hotel': '#D4A5A5',
  'Coffee': '#8B7355',
  'Breakfast': '#E8B4B8',
  'Bakery': '#E8B4B8',
  'Restaurant': '#A8B89C',
  'Lunch': '#A8B89C',
  'Dinner': '#A8B89C',
  'Cultural': '#6B5344',
  'Temple': '#6B5344',
  'Shrine': '#6B5344',
  'Museum': '#6B5344',
  'Shopping': '#C5D4B8',
  'Nightlife': '#A89880',
  'Entertainment': '#C5D4B8',
  'Park': '#A8B89C',
  'Garden': '#A8B89C',
};

// Map emojis to categories
const EMOJI_TO_CATEGORY: Record<string, string> = {
  '🏨': 'Hotel',
  '☕': 'Coffee',
  '🥐': 'Breakfast',
  '🍳': 'Breakfast',
  '🍜': 'Restaurant',
  '🍱': 'Restaurant',
  '🍽️': 'Restaurant',
  '🍣': 'Restaurant',
  '🍺': 'Nightlife',
  '🍷': 'Nightlife',
  '⛩️': 'Cultural',
  '🏛️': 'Cultural',
  '🎨': 'Cultural',
  '🛍️': 'Shopping',
  '🎮': 'Entertainment',
  '💆': 'Entertainment',
  '🌳': 'Park',
  '🌆': 'Entertainment',
  '📸': 'Entertainment',
};

/**
 * Get category from emoji
 */
export function getCategoryFromEmoji(emoji: string): string {
  return EMOJI_TO_CATEGORY[emoji] || 'Other';
}

/**
 * Get color for a category
 */
export function getColorForCategory(category: string): string {
  return CATEGORY_COLORS[category] || '#8B7355';
}

export interface EnhancedLocation extends Location {
  dayNumber: number;
  activityId: string;
  time?: string;
}

/**
 * Create map locations from activities
 * Matches existing locations to activities by name and adds day information
 */
export function deriveLocationsFromDays(
  days: Day[],
  existingLocations: Location[]
): EnhancedLocation[] {
  const enhancedLocations: EnhancedLocation[] = [];

  // Create a lookup map for existing locations by normalized name
  const locationMap = new Map<string, Location>();
  existingLocations.forEach(loc => {
    const normalizedName = loc.name.toLowerCase().trim();
    locationMap.set(normalizedName, loc);
  });

  // Process each day's main activities
  days.forEach(day => {
    day.activities.forEach(activity => {
      const normalizedTitle = activity.title.toLowerCase().trim();

      // Try to find matching location
      const matchedLocation = locationMap.get(normalizedTitle);

      if (matchedLocation) {
        // Use existing location data with day info
        enhancedLocations.push({
          ...matchedLocation,
          dayNumber: day.dayNumber,
          activityId: activity.id,
          time: activity.time,
        });
      } else {
        // Try partial matching
        let foundMatch: Location | undefined;
        for (const [name, loc] of locationMap.entries()) {
          if (normalizedTitle.includes(name) || name.includes(normalizedTitle)) {
            foundMatch = loc;
            break;
          }
        }

        if (foundMatch) {
          enhancedLocations.push({
            ...foundMatch,
            dayNumber: day.dayNumber,
            activityId: activity.id,
            time: activity.time,
          });
        }
        // If no match found, activity won't appear on map (no coordinates)
      }
    });
  });

  return enhancedLocations;
}

/**
 * Get unique categories from locations
 */
export function getUniqueCategories(locations: EnhancedLocation[]): string[] {
  const categories = new Set(locations.map(loc => loc.category));
  return Array.from(categories).sort();
}

/**
 * Get unique day numbers from locations
 */
export function getUniqueDays(locations: EnhancedLocation[]): number[] {
  const days = new Set(locations.map(loc => loc.dayNumber));
  return Array.from(days).sort((a, b) => a - b);
}

/**
 * Filter locations based on selected categories and days
 */
export function filterLocations(
  locations: EnhancedLocation[],
  selectedCategories: string[],
  selectedDays: number[]
): EnhancedLocation[] {
  return locations.filter(loc => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(loc.category);
    const dayMatch = selectedDays.length === 0 || selectedDays.includes(loc.dayNumber);
    return categoryMatch && dayMatch;
  });
}
