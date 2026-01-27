import { eq } from 'drizzle-orm';
import { getDb } from './index';
import { plans, days, activities, locations } from './schema';
import type { Plan, Activity, Day, Location, GeneratedItinerary, PlanPreferences, PlanSummary } from '../types/itinerary';
import { generateActivityId } from '../utils/nanoid';

export async function createPlan(
  id: string,
  destination: string,
  numDays: number,
  accommodationLocation: string | undefined,
  preferences: PlanPreferences | undefined,
  itinerary: GeneratedItinerary
): Promise<string> {
  // Insert plan
  await getDb().insert(plans).values({
    id,
    destination,
    numDays,
    accommodationLocation,
    preferences,
  });

  // Insert days and activities
  for (const dayData of itinerary.days) {
    const [insertedDay] = await getDb().insert(days).values({
      planId: id,
      dayNumber: dayData.dayNumber,
      title: dayData.title,
      description: dayData.description || '',
    }).returning({ id: days.id });

    const dayId = insertedDay.id;

    // Insert main activities
    for (let i = 0; i < dayData.activities.length; i++) {
      const activity = dayData.activities[i];
      await getDb().insert(activities).values({
        id: generateActivityId(),
        dayId,
        type: 'main',
        sortOrder: i,
        time: activity.time,
        emoji: activity.emoji,
        title: activity.title,
        details: activity.details,
        rating: activity.rating,
        price: activity.price,
        mapUrl: activity.mapUrl,
      });
    }

    // Insert alternatives
    for (let i = 0; i < dayData.alternatives.length; i++) {
      const alt = dayData.alternatives[i];
      await getDb().insert(activities).values({
        id: generateActivityId(),
        dayId,
        type: 'alternative',
        sortOrder: i,
        time: alt.time,
        emoji: alt.emoji,
        title: alt.title,
        details: alt.details,
        rating: alt.rating,
        price: alt.price,
        mapUrl: alt.mapUrl,
      });
    }
  }

  // Insert locations
  for (const loc of itinerary.locations) {
    await getDb().insert(locations).values({
      planId: id,
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      emoji: loc.emoji,
      color: loc.color,
      category: loc.category,
      rating: loc.rating,
    });
  }

  return id;
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const plan = await getDb().query.plans.findFirst({
    where: eq(plans.id, id),
    with: {
      days: {
        with: {
          activities: true,
        },
        orderBy: (days, { asc }) => [asc(days.dayNumber)],
      },
      locations: true,
    },
  });

  if (!plan) return null;

  // Transform to match the Plan interface
  const transformedDays: Day[] = plan.days.map(day => {
    const dayActivities = day.activities || [];
    return {
      id: day.id,
      planId: day.planId,
      dayNumber: day.dayNumber,
      title: day.title,
      description: day.description || '',
      activities: dayActivities
        .filter(a => a.type === 'main')
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(a => ({
          id: a.id,
          dayId: a.dayId,
          type: a.type as 'main',
          sortOrder: a.sortOrder,
          time: a.time || '',
          emoji: a.emoji || '',
          title: a.title,
          details: a.details || '',
          rating: a.rating || undefined,
          price: a.price || undefined,
          mapUrl: a.mapUrl || undefined,
        })),
      alternatives: dayActivities
        .filter(a => a.type === 'alternative')
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(a => ({
          id: a.id,
          dayId: a.dayId,
          type: a.type as 'alternative',
          sortOrder: a.sortOrder,
          time: a.time || '',
          emoji: a.emoji || '',
          title: a.title,
          details: a.details || '',
          rating: a.rating || undefined,
          price: a.price || undefined,
          mapUrl: a.mapUrl || undefined,
        })),
      removed: dayActivities
        .filter(a => a.type === 'removed')
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(a => ({
          id: a.id,
          dayId: a.dayId,
          type: a.type as 'removed',
          sortOrder: a.sortOrder,
          time: a.time || '',
          emoji: a.emoji || '',
          title: a.title,
          details: a.details || '',
          rating: a.rating || undefined,
          price: a.price || undefined,
          mapUrl: a.mapUrl || undefined,
        })),
    };
  });

  const transformedLocations: Location[] = plan.locations.map(loc => ({
    id: loc.id,
    planId: loc.planId,
    name: loc.name,
    lat: loc.lat,
    lng: loc.lng,
    emoji: loc.emoji || '',
    color: loc.color || '#2196F3',
    category: loc.category || 'Other',
    rating: loc.rating || undefined,
  }));

  return {
    id: plan.id,
    destination: plan.destination,
    numDays: plan.numDays,
    accommodationLocation: plan.accommodationLocation || undefined,
    accommodationLat: plan.accommodationLat || undefined,
    accommodationLng: plan.accommodationLng || undefined,
    preferences: plan.preferences || undefined,
    days: transformedDays,
    locations: transformedLocations,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

export async function updateActivityPositions(
  planId: string,
  updates: { [activityId: string]: { type: 'main' | 'alternative' | 'removed'; dayId: string; sortOrder: number } }
): Promise<void> {
  // Update each activity
  for (const [activityId, data] of Object.entries(updates)) {
    await getDb().update(activities)
      .set({
        type: data.type,
        dayId: data.dayId,
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(activities.id, activityId));
  }

  // Update plan's updatedAt
  await getDb().update(plans)
    .set({ updatedAt: new Date() })
    .where(eq(plans.id, planId));
}

export async function getPlanSummaries(): Promise<PlanSummary[]> {
  const allPlans = await getDb().query.plans.findMany({
    orderBy: (plans, { desc }) => [desc(plans.createdAt)],
  });

  return allPlans.map(plan => ({
    id: plan.id,
    destination: plan.destination,
    numDays: plan.numDays,
    createdAt: plan.createdAt.toISOString(),
  }));
}

export async function deletePlan(id: string): Promise<void> {
  await getDb().delete(plans).where(eq(plans.id, id));
}

export async function updateActivity(
  activityId: string,
  data: Partial<{
    time: string;
    emoji: string;
    title: string;
    details: string;
    rating: string | null;
    price: string | null;
    mapUrl: string | null;
  }>
): Promise<void> {
  await getDb().update(activities)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(activities.id, activityId));
}

export async function createActivity(
  dayId: string,
  data: {
    type: 'main' | 'alternative';
    sortOrder: number;
    time: string;
    emoji: string;
    title: string;
    details: string;
    rating?: string;
    price?: string;
    mapUrl?: string;
  }
): Promise<string> {
  const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  await getDb().insert(activities).values({
    id,
    dayId,
    type: data.type,
    sortOrder: data.sortOrder,
    time: data.time,
    emoji: data.emoji,
    title: data.title,
    details: data.details,
    rating: data.rating || null,
    price: data.price || null,
    mapUrl: data.mapUrl || null,
  });
  return id;
}
