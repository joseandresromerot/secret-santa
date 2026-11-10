CREATE TYPE "public"."draw_status" AS ENUM('draft', 'completed');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draw_id" uuid NOT NULL,
	"giver_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"email_status" "email_status" DEFAULT 'pending' NOT NULL,
	"email_error" text,
	"email_attempts" integer DEFAULT 0 NOT NULL,
	"email_sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "draw_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draw_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draws" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"event_date" date,
	"budget" text,
	"message" text,
	"locale" text DEFAULT 'es' NOT NULL,
	"status" "draw_status" DEFAULT 'draft' NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_exclusions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draw_id" uuid NOT NULL,
	"group_a_id" uuid NOT NULL,
	"group_b_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draw_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"group_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_draw_id_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_giver_id_participants_id_fk" FOREIGN KEY ("giver_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_receiver_id_participants_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw_groups" ADD CONSTRAINT "draw_groups_draw_id_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_exclusions" ADD CONSTRAINT "group_exclusions_draw_id_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_exclusions" ADD CONSTRAINT "group_exclusions_group_a_id_draw_groups_id_fk" FOREIGN KEY ("group_a_id") REFERENCES "public"."draw_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_exclusions" ADD CONSTRAINT "group_exclusions_group_b_id_draw_groups_id_fk" FOREIGN KEY ("group_b_id") REFERENCES "public"."draw_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_draw_id_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_group_id_draw_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."draw_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_giver_idx" ON "assignments" USING btree ("giver_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_receiver_idx" ON "assignments" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "assignments_draw_idx" ON "assignments" USING btree ("draw_id");--> statement-breakpoint
CREATE INDEX "draw_groups_draw_idx" ON "draw_groups" USING btree ("draw_id");--> statement-breakpoint
CREATE INDEX "draws_owner_idx" ON "draws" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "group_exclusions_pair_idx" ON "group_exclusions" USING btree ("group_a_id","group_b_id");--> statement-breakpoint
CREATE INDEX "participants_draw_idx" ON "participants" USING btree ("draw_id");