import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/claude/client';
import { buildItineraryPrompt } from '@/lib/claude/prompts';
import { parseItineraryResponse } from '@/lib/claude/parse';
import type { CreatePlanInput } from '@/lib/types/itinerary';

export async function POST(request: NextRequest) {
  try {
    const body: CreatePlanInput = await request.json();

    if (!body.destination || !body.numDays) {
      return NextResponse.json(
        { error: 'Destination and number of days are required' },
        { status: 400 }
      );
    }

    const prompt = buildItineraryPrompt(
      body.destination,
      body.numDays,
      body.accommodationLocation,
      body.preferences
    );

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    const itinerary = parseItineraryResponse(responseText);

    return NextResponse.json(itinerary);
  } catch (error) {
    console.error('Error generating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}
