import { NextRequest, NextResponse } from 'next/server';
import { updateActivity } from '@/lib/db/queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await updateActivity(id, {
      time: body.time,
      emoji: body.emoji,
      title: body.title,
      details: body.details,
      rating: body.rating || null,
      price: body.price || null,
      mapUrl: body.mapUrl || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}
