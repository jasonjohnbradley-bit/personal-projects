import type { PlanPreferences } from '../types/itinerary';

/**
 * Prompt for enhancing user places with details (not scheduling)
 * Used to get emoji, rating, price, coordinates, mapUrl for user-specified places
 */
export function buildUserPlaceEnhancementPrompt(
  userPlaces: string[],
  destination: string
): string {
  return `For the following places in ${destination}, provide details in JSON format.

Places to enhance:
${userPlaces.map((p, i) => `${i + 1}. ${p}`).join('\n')}

For EACH place, return accurate information:
{
  "places": [
    {
      "originalName": "exact name from input",
      "emoji": "appropriate emoji (☕ coffee, 🍜 noodles, ⛩️ temple, 🛍️ shopping, 🏛️ museum, 🌳 park, 🍽️ restaurant, 🍣 sushi, etc.)",
      "details": "Brief description under 100 chars",
      "rating": "REQUIRED: X.X format (1.0-5.0) or N/A if unknown",
      "price": "REQUIRED: $, $$, $$$, $$$$ or Free (never use ¥ or other currencies)",
      "lat": latitude as number,
      "lng": longitude as number,
      "mapUrl": "https://www.google.com/maps/search/Place+Name+${encodeURIComponent(destination)}",
      "category": "Restaurant|Coffee|Cultural|Shopping|Entertainment|Park|Temple|Museum|Nightlife"
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown code blocks
- Do NOT add places not in the original list
- Use accurate coordinates for each location
- Match the originalName exactly to the input`;
}

/**
 * Prompt for generating day themes based on scheduled places
 * Creates cohesive day structure around user's pre-selected places
 */
export function buildDayThemesPrompt(
  destination: string,
  numDays: number,
  userPlacesByDay: string[][],
  accommodationLocation?: string
): string {
  const userPlacesSummary = userPlacesByDay
    .map((places, i) => `Day ${i + 1}: ${places.length > 0 ? places.join(', ') : 'No user places assigned'}`)
    .join('\n');

  return `Create day themes for a ${numDays}-day ${destination} trip based on these pre-selected places.

User's places already scheduled by day:
${userPlacesSummary}

${accommodationLocation ? `Accommodation: ${accommodationLocation}` : ''}

For each day, provide a theme/title and brief description that:
1. Reflects the user's places for that day
2. Suggests a logical neighborhood/area to explore
3. If a day has no user places, suggest a popular area

Return as JSON:
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Theme/Area name (e.g., 'Shibuya & Harajuku')",
      "description": "Brief overview of the day in one sentence"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`;
}

/**
 * Prompt for generating AI suggestions for a specific day
 * Creates complementary suggestions that don't duplicate user activities
 */
export function buildAISuggestionsPrompt(
  destination: string,
  dayNumber: number,
  dayTheme: string,
  existingActivities: string[],
  preferences: PlanPreferences
): string {
  const cuisines = preferences.cuisineTypes.length > 0
    ? preferences.cuisineTypes.join(', ')
    : 'varied local cuisine';

  const cultural = preferences.culturalInterests.length > 0
    ? preferences.culturalInterests.join(', ')
    : 'general cultural attractions';

  const coffeeShops = preferences.coffeeShopsPerDay || 1;

  return `Generate 5-6 AI suggestions for Day ${dayNumber} of a ${destination} trip.

Day theme/area: ${dayTheme}
Already planned by user: ${existingActivities.length > 0 ? existingActivities.join(', ') : 'None yet'}

User preferences:
- Cuisine interests: ${cuisines}
- Cultural interests: ${cultural}
- Coffee shops desired: ${coffeeShops} per day

Generate COMPLEMENTARY suggestions that:
1. Are in the same general area as the day's theme
2. Don't duplicate the user's existing activities
3. Include a good mix of:
   - 1-2 restaurants (breakfast, lunch, or dinner options)
   - 1 coffee shop
   - 1-2 cultural attractions or activities
   - 1 shopping or entertainment option

MANDATORY DATA REQUIREMENTS:
- rating: REQUIRED for all (format "X.X" e.g. "4.5", or "N/A" if unknown)
- price: REQUIRED for all (use ONLY: $, $$, $$$, $$$$ or "Free")
- NEVER use ¥, €, £ symbols - always use $ regardless of destination
- details: REQUIRED - never leave empty

Return as JSON:
{
  "suggestions": [
    {
      "emoji": "☕",
      "title": "Place Name",
      "details": "Brief description under 100 chars",
      "rating": "4.5",
      "price": "$$",
      "lat": 35.1234,
      "lng": 139.5678,
      "mapUrl": "https://www.google.com/maps/search/Place+Name+${destination}",
      "category": "Coffee"
    }
  ]
}

Categories to use: Coffee, Restaurant, Cultural, Temple, Museum, Shopping, Entertainment, Park, Nightlife

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`;
}

/**
 * Original full itinerary prompt - kept for fallback or when no user places exist
 */
export function buildItineraryPrompt(
  destination: string,
  numDays: number,
  accommodationLocation: string | undefined,
  preferences: PlanPreferences
): string {
  const cuisines = preferences.cuisineTypes.length > 0
    ? preferences.cuisineTypes.join(', ')
    : 'varied local cuisine';

  const coffeeShops = preferences.coffeeShopsPerDay || 0;

  const cultural = preferences.culturalInterests.length > 0
    ? preferences.culturalInterests.join(', ')
    : 'general cultural attractions';

  const shopping = preferences.shoppingPreferences.length > 0
    ? preferences.shoppingPreferences.join(', ')
    : 'minimal shopping';

  const activityLevel = {
    relaxed: '2-3 main activities per day with plenty of free time',
    moderate: '4-5 activities per day with reasonable pacing',
    packed: '6+ activities per day, maximizing the experience',
  }[preferences.activityLevel];

  return `Create a detailed ${numDays}-day travel itinerary for ${destination}.

Traveler preferences:
- Cuisine interests: ${cuisines}
- Coffee shops: Include exactly ${coffeeShops} specialty coffee shop${coffeeShops !== 1 ? 's' : ''} per day
- Cultural interests: ${cultural}
- Shopping: ${shopping}
- Activity level: ${activityLevel}
${accommodationLocation ? `- Staying at/near: ${accommodationLocation}` : ''}

MANDATORY MEALS (MUST be included for EVERY day):
- Breakfast: Include exactly 1 breakfast/brunch activity between 8:00-10:00 AM
  Use emoji: 🥐 for bakery/cafe OR 🍳 for restaurant breakfast
- Lunch: Include exactly 1 lunch activity between 12:00-2:00 PM
  Use emoji: 🍜 for noodles/ramen OR 🍱 for bento/set meal OR 🍽️ for casual restaurant
- Dinner: Include exactly 1 dinner activity between 6:00-8:00 PM
  Use emoji: 🍽️ for restaurant OR 🍣 for sushi/seafood OR 🍺 for izakaya

These 3 meals are NON-NEGOTIABLE and must appear in every day's main activities.

For each day, provide:
1. A theme (e.g., "Shibuya & Harajuku")
2. Brief description (1 sentence)
3. 4-5 main activities with times (include exactly ${coffeeShops} coffee shop${coffeeShops !== 1 ? 's' : ''} per day)
4. 2 alternative options

Keep descriptions SHORT (under 100 characters each). Organize days by neighborhood.

MANDATORY DATA FOR ALL ACTIVITIES:
- rating: REQUIRED (format "X.X" e.g. "4.5")
- price: REQUIRED (use ONLY: $, $$, $$$, $$$$ or "Free" - never ¥ or other currencies)

CRITICAL: Keep the response compact to avoid truncation.

Return your response as valid JSON matching this exact structure:
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Day theme/area",
      "description": "Brief overview of the day",
      "activities": [
        {
          "type": "main",
          "source": "ai",
          "sortOrder": 0,
          "time": "9:00 AM",
          "emoji": "☕",
          "title": "Place Name",
          "details": "Description of the place and what to do there",
          "rating": "4.5",
          "price": "$$",
          "mapUrl": "https://www.google.com/maps/search/Place+Name+City"
        }
      ],
      "alternatives": [
        {
          "type": "alternative",
          "source": "ai",
          "sortOrder": 0,
          "time": "☕ Breakfast Alternative",
          "emoji": "☕",
          "title": "Alternative Place",
          "details": "Full description - never TBD",
          "rating": "4.3",
          "price": "$"
        }
      ]
    }
  ],
  "locations": [
    {
      "name": "Place Name",
      "lat": 35.6812,
      "lng": 139.7671,
      "emoji": "☕",
      "color": "#8B4513",
      "category": "Coffee",
      "rating": "4.5",
      "dayNumber": 1
    }
  ]
}

IMPORTANT FOR LOCATIONS:
- Include a location entry for EVERY main activity across ALL days
- The "name" in locations MUST exactly match the "title" in activities
- Include "dayNumber" for each location to indicate which day it belongs to

Use these colors for location categories:
- Hotel: #FF1744
- Coffee: #8B4513
- Restaurant: #4CAF50
- Bakery: #FF9800
- Cultural/Temple: #9C27B0
- Shopping: #2196F3
- Entertainment: #2196F3
- Nightlife: #FF9800

IMPORTANT: Return ONLY the JSON, no markdown code blocks or additional text.`;
}
