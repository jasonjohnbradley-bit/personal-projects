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
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "source" text DEFAULT 'ai' NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "lat" real;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "lng" real;--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;