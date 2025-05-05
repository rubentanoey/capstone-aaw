CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid DEFAULT gen_random_uuid(),
	"tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000000',
	"username" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"password" varchar(256) NOT NULL,
	"full_name" varchar(256),
	"address" text,
	"phone_number" varchar(256),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_tenant_id_username_email_pk" PRIMARY KEY("tenant_id","username","email"),
	CONSTRAINT "users_id_unique" UNIQUE("id")
);
