CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid DEFAULT gen_random_uuid(),
	"name" varchar NOT NULL,
	"tenant_id" uuid NOT NULL,
	CONSTRAINT "categories_id_tenant_id_pk" PRIMARY KEY("id","tenant_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar,
	"price" integer NOT NULL,
	"quantity_available" integer NOT NULL,
	"category_id" uuid
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("tenant_id","category_id") REFERENCES "categories"("tenant_id","id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
