CREATE TABLE IF NOT EXISTS "wishlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wishlist_detail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wishlist_id" uuid NOT NULL,
	"product_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wishlist_detail" ADD CONSTRAINT "wishlist_detail_wishlist_id_wishlist_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "wishlist"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
