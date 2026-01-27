import { pgTable, text, timestamp, integer, real, json, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { PlanPreferences } from '../types/itinerary';

// Main itinerary/plan table
export const plans = pgTable('plans', {
  id: text('id').primaryKey(),
  destination: text('destination').notNull(),
  numDays: integer('num_days').notNull(),
  accommodationLocation: text('accommodation_location'),
  accommodationLat: real('accommodation_lat'),
  accommodationLng: real('accommodation_lng'),
  preferences: json('preferences').$type<PlanPreferences>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Days within a plan
export const days = pgTable('days', {
  id: uuid('id').defaultRandom().primaryKey(),
  planId: text('plan_id').references(() => plans.id, { onDelete: 'cascade' }).notNull(),
  dayNumber: integer('day_number').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Activities (both main and alternatives)
export const activities = pgTable('activities', {
  id: text('id').primaryKey(),
  dayId: uuid('day_id').references(() => days.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull().$type<'main' | 'alternative' | 'removed'>(),
  sortOrder: integer('sort_order').notNull(),
  time: text('time'),
  emoji: text('emoji'),
  title: text('title').notNull(),
  details: text('details'),
  rating: text('rating'),
  price: text('price'),
  mapUrl: text('map_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Map locations
export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  planId: text('plan_id').references(() => plans.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  emoji: text('emoji'),
  color: text('color'),
  category: text('category'),
  rating: text('rating'),
});

// Relations
export const plansRelations = relations(plans, ({ many }) => ({
  days: many(days),
  locations: many(locations),
}));

export const daysRelations = relations(days, ({ one, many }) => ({
  plan: one(plans, {
    fields: [days.planId],
    references: [plans.id],
  }),
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  day: one(days, {
    fields: [activities.dayId],
    references: [days.id],
  }),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  plan: one(plans, {
    fields: [locations.planId],
    references: [plans.id],
  }),
}));
