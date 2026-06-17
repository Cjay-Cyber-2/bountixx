ALTER TABLE "room_players" ALTER COLUMN "status" SET DEFAULT 'invited';--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "language" text;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "starter_code" text;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "prize_pool" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "questions_json" text;