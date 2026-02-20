-- Add source column to activities table
ALTER TABLE "activities" ADD COLUMN "source" text NOT NULL DEFAULT 'ai';

-- Add lat/lng to activities for proximity calculations
ALTER TABLE "activities" ADD COLUMN "lat" real;
ALTER TABLE "activities" ADD COLUMN "lng" real;

-- Create AI suggestions table
CREATE TABLE "ai_suggestions" (
  "id" text PRIMARY KEY NOT NULL,
  "plan_id" text NOT NULL,
  "day_number" integer NOT NULL,
  "emoji" text,
  "title" text NOT NULL,
  "details" text,
  "rating" text,
  "price" text,
  "map_url" text,
  "lat" real,
  "lng" real,
  "category" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_plan_id_plans_id_fk"
  FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;

-- Create index for efficient day-based queries
CREATE INDEX "ai_suggestions_plan_day_idx" ON "ai_suggestions" ("plan_id", "day_number");
