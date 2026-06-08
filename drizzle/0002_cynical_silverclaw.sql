CREATE TABLE "push_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "room_players" ALTER COLUMN "status" SET DEFAULT 'joined';--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "canonical_answer" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "consecutive_wins" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;