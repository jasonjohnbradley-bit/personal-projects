import type { PlanPreferences } from '../types/itinerary';

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

  const userRecs = preferences.userRecommendations && preferences.userRecommendations.length > 0
    ? `\n\nCRITICAL - USER'S MUST-VISIT PLACES (${preferences.userRecommendations.length} total):
${preferences.userRecommendations.map((p, i) => `${i + 1}. ${p}`).join('\n')}

REQUIREMENTS FOR USER PLACES:
- Every place listed above MUST appear in your response
- Prioritize including them as main activities
- If a day is full, include remaining user places as alternatives
- Use the exact names provided by the user
- AI suggestions fill remaining activity slots after user places are included`
    : '';

  return `Create a detailed ${numDays}-day travel itinerary for ${destination}.

Traveler preferences:
- Cuisine interests: ${cuisines}
- Coffee shops: Include exactly ${coffeeShops} specialty coffee shop${coffeeShops !== 1 ? 's' : ''} per day
- Cultural interests: ${cultural}
- Shopping: ${shopping}
- Activity level: ${activityLevel}
${accommodationLocation ? `- Staying at/near: ${accommodationLocation}` : ''}
${userRecs}

For each day, provide:
1. A theme (e.g., "Shibuya & Harajuku")
2. Brief description (1 sentence)
3. 4-5 main activities with times (include exactly ${coffeeShops} coffee shop${coffeeShops !== 1 ? 's' : ''} per day)
4. 2 alternative options

Keep descriptions SHORT (under 100 characters each). Organize days by neighborhood.

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
          "sortOrder": 0,
          "time": "9:00 AM",
          "emoji": "☕",
          "title": "Place Name",
          "details": "Description of the place and what to do there",
          "rating": "4.5",
          "price": "¥¥",
          "mapUrl": "https://www.google.com/maps/search/Place+Name+City"
        }
      ],
      "alternatives": [
        {
          "type": "alternative",
          "sortOrder": 0,
          "time": "☕ Breakfast Alternative",
          "emoji": "☕",
          "title": "Alternative Place",
          "details": "Full description - never TBD",
          "rating": "4.3",
          "price": "¥"
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
      "rating": "4.5"
    }
  ]
}

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
