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

  const coffeeLevel = {
    none: 'not interested in coffee shops',
    low: 'occasional coffee stops',
    medium: 'daily specialty coffee',
    high: 'multiple specialty coffee shops daily',
  }[preferences.coffeeInterest];

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
    ? `\n\nIMPORTANT: The user specifically wants to visit these places - you MUST include ALL of them in the itinerary (either in main schedule or as alternatives): ${preferences.userRecommendations.join(', ')}`
    : '';

  return `Create a detailed ${numDays}-day travel itinerary for ${destination}.

Traveler preferences:
- Cuisine interests: ${cuisines}
- Coffee: ${coffeeLevel}
- Cultural interests: ${cultural}
- Shopping: ${shopping}
- Activity level: ${activityLevel}
${accommodationLocation ? `- Staying at/near: ${accommodationLocation}` : ''}
${userRecs}

For each day, provide:
1. A theme/focus for the day (e.g., "Shibuya & Harajuku" or "Historic Old Town")
2. A brief description of the day
3. 5-6 main activities with times, covering:
   - Morning coffee/breakfast
   - Cultural/sightseeing activity
   - Lunch
   - Afternoon activity
   - Dinner
   - Optional evening activity
4. 2-4 alternative options for that day

For EACH location/activity, provide:
- Name (include local name if applicable)
- Approximate time slot (e.g., "9:00 AM")
- Appropriate emoji (☕ coffee, 🍜 food, ⛩️ temple, 🛍️ shopping, etc.)
- Brief description (1-2 sentences)
- Rating (if known, e.g., "4.5")
- Price range (use local currency symbols like ¥¥ or $$$)
- Approximate latitude and longitude for mapping

Organize days geographically - each day should focus on 1-2 neighborhoods to minimize transit.

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
