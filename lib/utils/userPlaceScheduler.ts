import type { Activity, ActivitySource } from '../types/itinerary';
import {
  getActivityDuration,
  TRAVEL_BUFFER,
  minutesToTimeString,
  parseTimeToMinutes,
  DEFAULT_DAY_START,
} from './timeCalculation';

export interface UserPlaceInput {
  name: string;
  lat?: number;
  lng?: number;
}

export interface ScheduledPlace {
  name: string;
  dayNumber: number;
  lat?: number;
  lng?: number;
}

interface DayCluster {
  dayNumber: number;
  places: UserPlaceInput[];
  centroid: { lat: number; lng: number } | null;
}

/**
 * Calculate Haversine distance between two coordinates in km
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate centroid of a set of places
 */
function calculateCentroid(
  places: UserPlaceInput[]
): { lat: number; lng: number } | null {
  const coordPlaces = places.filter(
    (p) => p.lat !== undefined && p.lng !== undefined
  );
  if (coordPlaces.length === 0) return null;

  return {
    lat: coordPlaces.reduce((sum, p) => sum + p.lat!, 0) / coordPlaces.length,
    lng: coordPlaces.reduce((sum, p) => sum + p.lng!, 0) / coordPlaces.length,
  };
}

/**
 * Schedule user places across days using location proximity clustering
 *
 * Strategy:
 * 1. Places with coordinates are clustered by proximity
 * 2. Places without coordinates are distributed evenly across days
 * 3. If user specifies more places than can fit, overflow goes to alternatives
 */
export function scheduleUserPlaces(
  userPlaces: UserPlaceInput[],
  numDays: number,
  maxMainActivitiesPerDay: number = 5
): {
  mainActivities: ScheduledPlace[][];
  alternativeActivities: ScheduledPlace[];
} {
  if (userPlaces.length === 0) {
    return {
      mainActivities: Array.from({ length: numDays }, () => []),
      alternativeActivities: [],
    };
  }

  // Separate places with and without coordinates
  const placesWithCoords = userPlaces.filter(
    (p) => p.lat !== undefined && p.lng !== undefined
  );
  const placesWithoutCoords = userPlaces.filter(
    (p) => p.lat === undefined || p.lng === undefined
  );

  // Initialize day clusters
  const dayClusters: DayCluster[] = Array.from({ length: numDays }, (_, i) => ({
    dayNumber: i + 1,
    places: [],
    centroid: null,
  }));

  // Cluster places with coordinates using simple k-means-like assignment
  if (placesWithCoords.length > 0) {
    // Initialize: distribute places evenly first
    const placesPerDay = Math.ceil(placesWithCoords.length / numDays);
    placesWithCoords.forEach((place, i) => {
      const dayIndex = Math.min(Math.floor(i / placesPerDay), numDays - 1);
      dayClusters[dayIndex].places.push(place);
    });

    // Calculate initial centroids
    dayClusters.forEach((cluster) => {
      cluster.centroid = calculateCentroid(cluster.places);
    });

    // Reassign places to nearest centroid (one iteration for simplicity)
    const reassignedClusters: DayCluster[] = dayClusters.map((c) => ({
      ...c,
      places: [],
    }));

    placesWithCoords.forEach((place) => {
      let nearestDay = 0;
      let minDistance = Infinity;

      dayClusters.forEach((cluster, dayIndex) => {
        if (cluster.centroid && place.lat !== undefined && place.lng !== undefined) {
          const distance = haversineDistance(
            place.lat,
            place.lng,
            cluster.centroid.lat,
            cluster.centroid.lng
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestDay = dayIndex;
          }
        }
      });

      reassignedClusters[nearestDay].places.push(place);
    });

    // Update dayClusters with reassigned places
    reassignedClusters.forEach((cluster, i) => {
      dayClusters[i].places = cluster.places;
    });

    // Recalculate centroids after reassignment
    dayClusters.forEach((cluster) => {
      cluster.centroid = calculateCentroid(cluster.places);
    });
  }

  // Distribute places without coordinates evenly
  placesWithoutCoords.forEach((place, i) => {
    // Find the day with the fewest places
    const targetDayIndex = dayClusters.reduce(
      (minIdx, cluster, idx, arr) =>
        cluster.places.length < arr[minIdx].places.length ? idx : minIdx,
      0
    );
    dayClusters[targetDayIndex].places.push(place);
  });

  // Separate into main and alternative based on capacity
  const mainActivities: ScheduledPlace[][] = [];
  const alternativeActivities: ScheduledPlace[] = [];

  dayClusters.forEach((cluster) => {
    const mainForDay: ScheduledPlace[] = [];
    cluster.places.forEach((place, i) => {
      const scheduled: ScheduledPlace = {
        name: place.name,
        dayNumber: cluster.dayNumber,
        lat: place.lat,
        lng: place.lng,
      };

      if (i < maxMainActivitiesPerDay) {
        mainForDay.push(scheduled);
      } else {
        alternativeActivities.push(scheduled);
      }
    });
    mainActivities.push(mainForDay);
  });

  return { mainActivities, alternativeActivities };
}

/**
 * Convert scheduled places to Activity objects with times
 */
export function scheduledPlacesToActivities(
  scheduledPlaces: ScheduledPlace[],
  dayId: string,
  enhancedDetails?: Map<string, {
    emoji?: string;
    details?: string;
    rating?: string;
    price?: string;
    mapUrl?: string;
    lat?: number;
    lng?: number;
  }>,
  startTime: string = DEFAULT_DAY_START
): Omit<Activity, 'id'>[] {
  let currentMinutes = parseTimeToMinutes(startTime);

  return scheduledPlaces.map((place, index) => {
    const enhanced = enhancedDetails?.get(place.name.toLowerCase());
    const emoji = enhanced?.emoji || '📍';

    const activity: Omit<Activity, 'id'> = {
      dayId,
      type: 'main',
      source: 'user' as ActivitySource,
      sortOrder: index,
      time: minutesToTimeString(currentMinutes),
      emoji,
      title: place.name,
      details: enhanced?.details || 'Your recommended place',
      rating: enhanced?.rating,
      price: enhanced?.price,
      mapUrl: enhanced?.mapUrl,
      lat: enhanced?.lat || place.lat,
      lng: enhanced?.lng || place.lng,
    };

    // Add duration + buffer for next activity
    currentMinutes += getActivityDuration(emoji) + TRAVEL_BUFFER;

    return activity;
  });
}

/**
 * Convert overflow places to alternative activities
 */
export function overflowToAlternatives(
  overflowPlaces: ScheduledPlace[],
  dayId: string,
  enhancedDetails?: Map<string, {
    emoji?: string;
    details?: string;
    rating?: string;
    price?: string;
    mapUrl?: string;
    lat?: number;
    lng?: number;
  }>
): Omit<Activity, 'id'>[] {
  return overflowPlaces.map((place, index) => {
    const enhanced = enhancedDetails?.get(place.name.toLowerCase());

    return {
      dayId,
      type: 'alternative' as const,
      source: 'user' as ActivitySource,
      sortOrder: index,
      time: '',
      emoji: enhanced?.emoji || '📍',
      title: place.name,
      details: enhanced?.details || 'Your recommended place (overflow)',
      rating: enhanced?.rating,
      price: enhanced?.price,
      mapUrl: enhanced?.mapUrl,
      lat: enhanced?.lat || place.lat,
      lng: enhanced?.lng || place.lng,
    };
  });
}
