CREATE TABLE "user_rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"reward_type" text NOT NULL,
	"reward_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"earned_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_reward_key_idx" ON "user_rewards" USING btree ("user_id","reward_key");