import { NextRequest, NextResponse } from 'next/server';
import { createPlan, getPlanSummaries } from '@/lib/db/queries';
import { generatePlanId } from '@/lib/utils/nanoid';
import { anthropic } from '@/lib/claude/client';
import { buildItineraryPrompt } from '@/lib/claude/prompts';
import { parseItineraryResponse } from '@/lib/claude/parse';
import type { CreatePlanInput, GeneratedItinerary } from '@/lib/types/itinerary';

export async function POST(request: NextRequest) {
  try {
    const body: CreatePlanInput = await request.json();

    if (!body.destination || !body.numDays) {
      return NextResponse.json(
        { error: 'Destination and number of days are required' },
        { status: 400 }
      );
    }

    // Generate itinerary using Claude AI
    const prompt = buildItineraryPrompt(
      body.destination,
      body.numDays,
      body.accommodationLocation,
      body.preferences
    );

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    const itinerary: GeneratedItinerary = parseItineraryResponse(responseText);

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
