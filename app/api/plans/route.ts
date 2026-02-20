import { NextRequest, NextResponse } from 'next/server';
import { createPlan, getPlanSummaries } from '@/lib/db/queries';
import { generatePlanId } from '@/lib/utils/nanoid';
import { anthropic } from '@/lib/claude/client';
import {
  buildItineraryPrompt,
  buildUserPlaceEnhancementPrompt,
  buildDayThemesPrompt,
  buildAISuggestionsPrompt,
} from '@/lib/claude/prompts';
import { parseItineraryResponse } from '@/lib/claude/parse';
import { scheduleUserPlaces } from '@/lib/utils/userPlaceScheduler';
import type { CreatePlanInput, GeneratedItinerary, AISuggestion, PlanPreferences } from '@/lib/types/itinerary';

interface EnhancedPlace {
  originalName: string;
  emoji: string;
  details: string;
  rating?: string;
  price?: string;
  lat?: number;
  lng?: number;
  mapUrl?: string;
  category?: string;
}

/**
 * Extract clean place name from formatted string
 * Input: "Bakery: POTERI BAKERY -TOKYO- (4.5★; $$; Shibuya; Tokyo)"
 * Output: "POTERI BAKERY -TOKYO-"
 */
function extractPlaceName(formatted: string): string {
  let name = formatted;

  // Remove type prefix (e.g., "Bakery: ")
  const colonIndex = name.indexOf(':');
  if (colonIndex > 0 && colonIndex < 20) {
    name = name.substring(colonIndex + 1).trim();
  }

  // Remove details suffix (e.g., " (4.5★; $$; ...)")
  const parenIndex = name.indexOf(' (');
  if (parenIndex > 0) {
    name = name.substring(0, parenIndex).trim();
  }

  return name || formatted;
}

/**
 * Get fallback coordinates for common destinations
 */
function getFallbackCoordinates(destination: string): { lat: number; lng: number } | null {
  const dest = destination.toLowerCase();
  if (dest.includes('tokyo')) return { lat: 35.6762, lng: 139.6503 };
  if (dest.includes('kyoto')) return { lat: 35.0116, lng: 135.7681 };
  if (dest.includes('osaka')) return { lat: 34.6937, lng: 135.5023 };
  if (dest.includes('paris')) return { lat: 48.8566, lng: 2.3522 };
  if (dest.includes('london')) return { lat: 51.5074, lng: -0.1278 };
  if (dest.includes('new york')) return { lat: 40.7128, lng: -74.0060 };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePlanInput = await request.json();

    if (!body.destination || !body.numDays) {
      return NextResponse.json(
        { error: 'Destination and number of days are required' },
        { status: 400 }
      );
    }

    const userPlaces = body.preferences?.userRecommendations || [];
    let itinerary: GeneratedItinerary;

    if (userPlaces.length > 0) {
      // NEW FLOW: User has specified places - guarantee them
      itinerary = await generateItineraryWithUserPlaces(
        body.destination,
        body.numDays,
        body.accommodationLocation,
        body.preferences,
        userPlaces
      );
    } else {
      // FALLBACK: No user places - use original AI-only flow
      itinerary = await generateFullAIItinerary(
        body.destination,
        body.numDays,
        body.accommodationLocation,
        body.preferences
      );
    }

    // Generate plan ID and save to database
    const planId = generatePlanId();
    await createPlan(
      planId,
      body.destination,
      body.numDays,
      body.accommodationLocation,
      body.preferences,
      itinerary
    );

    return NextResponse.json({
      id: planId,
      redirectUrl: `/plan/${planId}`,
    });
  } catch (error) {
    console.error('Error creating plan:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorMessage = error instanceof Error ? error.message : 'Failed to create plan';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * New flow: Generate itinerary with guaranteed user places
 */
async function generateItineraryWithUserPlaces(
  destination: string,
  numDays: number,
  accommodationLocation: string | undefined,
  preferences: PlanPreferences,
  userPlaces: string[]
): Promise<GeneratedItinerary> {
  // Extract clean place names from formatted strings
  const cleanNames = userPlaces.map(extractPlaceName);
  console.log('Clean place names:', cleanNames);

  // STEP 1: Schedule user places deterministically (using clean names)
  const { mainActivities, alternativeActivities } = scheduleUserPlaces(
    cleanNames.map(name => ({ name })),
    numDays,
    5 // max main activities per day
  );

  // STEP 2: Enhance user places with Claude in batches (to avoid truncation)
  const enhancedPlaces = new Map<string, EnhancedPlace>();
  const BATCH_SIZE = 15;

  for (let i = 0; i < cleanNames.length; i += BATCH_SIZE) {
    const batch = cleanNames.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`Processing enhancement batch ${batchNum}: ${batch.length} places`);

    const enhancePrompt = buildUserPlaceEnhancementPrompt(batch, destination);
    const enhanceResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: 'You are a travel assistant. Return ONLY valid JSON with no markdown code blocks.',
      messages: [{ role: 'user', content: enhancePrompt }],
    });

    const enhanceText = enhanceResponse.content[0].type === 'text' ? enhanceResponse.content[0].text : '{"places":[]}';
    try {
      const cleanedText = enhanceText.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      if (parsed.places && Array.isArray(parsed.places)) {
        parsed.places.forEach((p: EnhancedPlace) => {
          enhancedPlaces.set(p.originalName.toLowerCase(), p);
        });
      }
      console.log(`Batch ${batchNum} parsed: ${parsed.places?.length || 0} places`);
    } catch (e) {
      console.error(`Failed to parse batch ${batchNum}:`, e);
      console.error('Raw response:', enhanceText.substring(0, 300));
    }
  }

  console.log('Total enhanced places:', enhancedPlaces.size);

  // STEP 3: Generate day themes based on scheduled places
  const userPlacesByDay = mainActivities.map(dayPlaces => dayPlaces.map(p => p.name));
  const themesPrompt = buildDayThemesPrompt(destination, numDays, userPlacesByDay, accommodationLocation);

  const themesResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: 'You are a travel assistant. Return ONLY valid JSON with no markdown code blocks.',
    messages: [{ role: 'user', content: themesPrompt }],
  });

  const themesText = themesResponse.content[0].type === 'text' ? themesResponse.content[0].text : '';
  let dayThemes: { days: { dayNumber: number; title: string; description: string }[] } = { days: [] };

  try {
    const cleanedThemes = themesText.replace(/```json\n?|\n?```/g, '').trim();
    dayThemes = JSON.parse(cleanedThemes);
  } catch (e) {
    console.error('Failed to parse day themes:', e);
  }

  // Ensure we have exactly numDays with valid titles (fallback for missing/incomplete data)
  dayThemes = {
    days: Array.from({ length: numDays }, (_, i) => {
      const existingDay = dayThemes.days?.find(d => d.dayNumber === i + 1) || dayThemes.days?.[i];
      return {
        dayNumber: i + 1,
        title: existingDay?.title || `Day ${i + 1} in ${destination}`,
        description: existingDay?.description || `Exploring ${destination}`,
      };
    }),
  };

  // STEP 4: Build itinerary structure with user activities
  const allAiSuggestions: Omit<AISuggestion, 'id' | 'planId'>[] = [];

  const itineraryDays = dayThemes.days.map((theme, dayIndex) => {
    const userActivitiesForDay = mainActivities[dayIndex] || [];

    // Convert user places to activities
    const fallbackCoords = getFallbackCoordinates(destination);
    const activities = userActivitiesForDay.map((place, sortOrder) => {
      const enhanced = enhancedPlaces.get(place.name.toLowerCase());
      const baseTime = 9 * 60 + sortOrder * 75; // Start at 9 AM, 75 min intervals
      const hours = Math.floor(baseTime / 60);
      const mins = baseTime % 60;
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const time = `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;

      // Use enhanced coords, then place coords, then fallback with spread
      // Add offset to fallback coords to prevent all markers stacking at same point
      const fallbackOffset = (dayIndex * 5 + sortOrder) * 0.003; // ~300m spread per marker
      const lat = enhanced?.lat || place.lat || (fallbackCoords?.lat ? fallbackCoords.lat + fallbackOffset : undefined);
      const lng = enhanced?.lng || place.lng || (fallbackCoords?.lng ? fallbackCoords.lng + fallbackOffset : undefined);

      return {
        type: 'main' as const,
        source: 'user' as const,
        sortOrder,
        time,
        emoji: enhanced?.emoji || '📍',
        title: place.name,
        details: enhanced?.details || 'Your recommended place',
        rating: enhanced?.rating,
        price: enhanced?.price,
        mapUrl: enhanced?.mapUrl,
        lat,
        lng,
      };
    });

    // Convert overflow to alternatives
    const overflowForDay = alternativeActivities.filter(p => p.dayNumber === dayIndex + 1);
    const alternatives = overflowForDay.map((place, sortOrder) => {
      const enhanced = enhancedPlaces.get(place.name.toLowerCase());
      // Spread offset for alternatives too
      const altOffset = (dayIndex * 5 + activities.length + sortOrder) * 0.003;
      return {
        type: 'alternative' as const,
        source: 'user' as const,
        sortOrder,
        time: '',
        emoji: enhanced?.emoji || '📍',
        title: place.name,
        details: enhanced?.details || 'Your recommended place (alternative)',
        rating: enhanced?.rating,
        price: enhanced?.price,
        mapUrl: enhanced?.mapUrl,
        lat: enhanced?.lat || place.lat || (fallbackCoords?.lat ? fallbackCoords.lat + altOffset : undefined),
        lng: enhanced?.lng || place.lng || (fallbackCoords?.lng ? fallbackCoords.lng + altOffset : undefined),
      };
    });

    return {
      dayNumber: theme.dayNumber,
      title: theme.title,
      description: theme.description,
      activities,
      alternatives,
    };
  });

  // STEP 5: Generate AI suggestions for each day
  for (let i = 0; i < numDays; i++) {
    const dayTheme = dayThemes.days[i];
    const existingActivities = mainActivities[i]?.map(p => p.name) || [];

    const suggestionsPrompt = buildAISuggestionsPrompt(
      destination,
      i + 1,
      dayTheme?.title || `Day ${i + 1}`,
      existingActivities,
      preferences
    );

    try {
      const suggestionsResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: 'You are a travel assistant. Return ONLY valid JSON with no markdown code blocks.',
        messages: [{ role: 'user', content: suggestionsPrompt }],
      });

      const suggestionsText = suggestionsResponse.content[0].type === 'text' ? suggestionsResponse.content[0].text : '';
      const cleanedSuggestions = suggestionsText.replace(/```json\n?|\n?```/g, '').trim();
      const suggestions = JSON.parse(cleanedSuggestions);

      if (suggestions.suggestions && Array.isArray(suggestions.suggestions)) {
        allAiSuggestions.push(
          ...suggestions.suggestions.map((s: Omit<AISuggestion, 'id' | 'planId' | 'dayNumber'>) => ({
            ...s,
            dayNumber: i + 1,
          }))
        );
      }
    } catch (e) {
      console.error(`Failed to generate AI suggestions for day ${i + 1}:`, e);
    }
  }

  // STEP 6: Build locations from activities
  const locations = itineraryDays.flatMap((day, dayIdx) =>
    day.activities
      .filter(a => a.lat && a.lng)
      .map(a => ({
        name: a.title,
        lat: a.lat!,
        lng: a.lng!,
        emoji: a.emoji,
        color: getCategoryColor(enhancedPlaces.get(a.title.toLowerCase())?.category || 'Other'),
        category: enhancedPlaces.get(a.title.toLowerCase())?.category || 'Other',
        rating: a.rating,
        dayNumber: dayIdx + 1,
      }))
  );

  console.log('Locations with coords:', locations.length);
  if (locations.length > 0) {
    console.log('Sample location:', locations[0]);
  }

  return {
    days: itineraryDays,
    locations,
    aiSuggestions: allAiSuggestions,
  };
}

/**
 * Original flow: Full AI-generated itinerary when no user places
 */
async function generateFullAIItinerary(
  destination: string,
  numDays: number,
  accommodationLocation: string | undefined,
  preferences: PlanPreferences
): Promise<GeneratedItinerary> {
  const prompt = buildItineraryPrompt(destination, numDays, accommodationLocation, preferences);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16384,
    system: 'You are a travel planning assistant. Return ONLY valid JSON with no markdown. Keep all text descriptions under 100 characters. Be concise.',
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const itinerary = parseItineraryResponse(responseText);

  // Add source field to all activities and empty aiSuggestions
  return {
    ...itinerary,
    days: itinerary.days.map(day => ({
      ...day,
      activities: day.activities.map(a => ({ ...a, source: 'ai' as const })),
      alternatives: day.alternatives.map(a => ({ ...a, source: 'ai' as const })),
    })),
    aiSuggestions: [],
  };
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Hotel: '#FF1744',
    Coffee: '#8B4513',
    Restaurant: '#4CAF50',
    Bakery: '#FF9800',
    Cultural: '#9C27B0',
    Temple: '#9C27B0',
    Museum: '#9C27B0',
    Shopping: '#2196F3',
    Entertainment: '#2196F3',
    Park: '#4CAF50',
    Nightlife: '#FF9800',
    Other: '#2196F3',
  };
  return colors[category] || '#2196F3';
}

export async function GET() {
  try {
    const plans = await getPlanSummaries();
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
