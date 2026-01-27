export interface Activity {
  id: string;
  dayId: string;
  type: 'main' | 'alternative' | 'removed';
  sortOrder: number;
  time: string;
  emoji: string;
  title: string;
  details: string;
  rating?: string;
  price?: string;
  mapUrl?: string;
}

export interface Day {
  id: string;
  planId: string;
  dayNumber: number;
  title: string;
  description: string;
  activities: Activity[];
  alternatives: Activity[];
  removed: Activity[];
}

export interface Location {
  id: string;
  planId: string;
  name: string;
  lat: number;
  lng: number;
  emoji: string;
  color: string;
  category: string;
  rating?: string;
}

export interface PlanPreferences {
  cuisineTypes: string[];
  coffeeInterest: 'none' | 'low' | 'medium' | 'high';
  shoppingPreferences: string[];
  culturalInterests: string[];
  activityLevel: 'relaxed' | 'moderate' | 'packed';
  userRecommendations?: string[];
}

export interface Plan {
  id: string;
  destination: string;
  numDays: number;
  accommodationLocation?: string;
  accommodationLat?: number;
  accommodationLng?: number;
  preferences?: PlanPreferences;
  days: Day[];
  locations: Location[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanInput {
  destination: string;
  numDays: number;
  accommodationLocation?: string;
  preferences: PlanPreferences;
}

export interface UpdateActivitiesInput {
  activities: {
    [activityId: string]: {
      type: 'main' | 'alternative' | 'removed';
      dayId: string;
      sortOrder: number;
    };
  };
}

export interface GeneratedItinerary {
  days: {
    dayNumber: number;
    title: string;
    description: string;
    activities: Omit<Activity, 'id' | 'dayId'>[];
    alternatives: Omit<Activity, 'id' | 'dayId'>[];
  }[];
  locations: Omit<Location, 'id' | 'planId'>[];
}

export interface PlanSummary {
  id: string;
  destination: string;
  numDays: number;
  createdAt: string;
}
