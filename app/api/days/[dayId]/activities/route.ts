import { NextRequest, NextResponse } from 'next/server';
import { createActivity } from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dayId: string }> }
) {
  try {
    const { dayId } = await params;
    const body = await request.json();

    const id = await createActivity(dayId, {
      type: body.type || 'main',
      sortOrder: body.sortOrder,
      time: body.time,
      emoji: body.emoji,
      title: body.title,
      details: body.details,
      rating: body.rating,
      price: body.price,
      mapUrl: body.mapUrl,
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
