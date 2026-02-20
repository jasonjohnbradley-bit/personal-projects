import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/claude/client';
import { buildAISuggestionsPrompt } from '@/lib/claude/prompts';
import { normalizePrice, normalizeRating } from '@/lib/claude/parse';
import { getAISuggestionsForPlan, addAISuggestions, convertSuggestionToActivity, deleteSuggestion } from '@/lib/db/queries';
import { getDb } from '@/lib/db/index';
import { plans, days } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { AISuggestion, PlanPreferences } from '@/lib/types/itinerary';

// GET: Fetch AI suggestions for a plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
    const url = new URL(request.url);
    const dayNumberParam = url.searchParams.get('dayNumber');
    const dayNumber = dayNumberParam ? parseInt(dayNumberParam, 10) : undefined;

    const suggestions = await getAISuggestionsForPlan(planId, dayNumber);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

// POST: Generate new AI suggestions for a specific day
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
    const body = await request.json();
    const { dayNumber } = body;

    if (!dayNumber) {
      return NextResponse.json(
        { error: 'dayNumber is required' },
        { status: 400 }
      );
    }

    // Get plan info
    const plan = await getDb().query.plans.findFirst({
      where: eq(plans.id, planId),
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get day info
    const day = await getDb().query.days.findFirst({
      where: and(eq(days.planId, planId), eq(days.dayNumber, dayNumber)),
      with: { activities: true },
    });

    if (!day) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    // Get existing activities for context
    const existingActivities = (day.activities || [])
      .filter(a => a.type === 'main')
      .map(a => a.title);

    // Generate AI suggestions
    const preferences: PlanPreferences = plan.preferences || {
      cuisineTypes: [],
      coffeeShopsPerDay: 1,
      culturalInterests: [],
      shoppingPreferences: [],
      activityLevel: 'moderate',
    };

    const prompt = buildAISuggestionsPrompt(
      plan.destination,
      dayNumber,
      day.title,
      existingActivities,
      preferences
    );

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: 'You are a travel planning assistant. Return ONLY valid JSON with no markdown code blocks.',
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();

    let parsedSuggestions: Omit<AISuggestion, 'id' | 'planId'>[] = [];

    try {
      const parsed = JSON.parse(cleanedResponse);
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        parsedSuggestions = parsed.suggestions.map((s: Omit<AISuggestion, 'id' | 'planId' | 'dayNumber'>) => ({
          ...s,
          dayNumber,
          rating: normalizeRating(s.rating),
          price: normalizePrice(s.price),
          details: s.details || 'Details not available',
        }));
      }
    } catch (e) {
      console.error('Failed to parse AI suggestions:', e);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Save suggestions to database
    const savedSuggestions = await addAISuggestions(planId, parsedSuggestions);

    return NextResponse.json({ suggestions: savedSuggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

// PATCH: Convert a suggestion to an activity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
    const body = await request.json();
    const { suggestionId, dayId, sortOrder } = body;

    if (!suggestionId || !dayId) {
      return NextResponse.json(
        { error: 'suggestionId and dayId are required' },
        { status: 400 }
      );
    }

    const activityId = await convertSuggestionToActivity(
      suggestionId,
      dayId,
      sortOrder ?? 0
    );

    return NextResponse.json({ activityId });
  } catch (error) {
    console.error('Error converting suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to convert suggestion' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a suggestion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const url = new URL(request.url);
    const suggestionId = url.searchParams.get('suggestionId');

    if (!suggestionId) {
      return NextResponse.json(
        { error: 'suggestionId is required' },
        { status: 400 }
      );
    }

    await deleteSuggestion(suggestionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to delete suggestion' },
      { status: 500 }
    );
  }
}
