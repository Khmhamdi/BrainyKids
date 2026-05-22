-- Désinscription sur Student
ALTER TABLE "public"."Student"
  ADD COLUMN IF NOT EXISTS "unregistered_at"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "unregistered_reason"  TEXT;

-- Payment : paid_date optionnel + nouveaux champs
ALTER TABLE "public"."Payment"
  ALTER COLUMN "paid_date"   DROP NOT NULL,
  ALTER COLUMN "description" DROP NOT NULL,
  ALTER COLUMN "parent_id"   DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "note"   TEXT,
  ADD COLUMN IF NOT EXISTS "month"  INTEGER,
  ADD COLUMN IF NOT EXISTS "year"   INTEGER;

-- Pack financier de l'enfant
CREATE TABLE IF NOT EXISTS "public"."StudentPack" (
  "id"                 TEXT NOT NULL,
  "student_id"         TEXT NOT NULL,
  "scolarite_amount"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cantine_enabled"    BOOLEAN NOT NULL DEFAULT false,
  "cantine_amount"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "transport_enabled"  BOOLEAN NOT NULL DEFAULT false,
  "transport_amount"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "clubs"              JSONB NOT NULL DEFAULT '[]',
  "discount"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "inscription_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "inscription_paid"   BOOLEAN NOT NULL DEFAULT false,
  "school_year"        TEXT NOT NULL,
  "start_month"        INTEGER NOT NULL DEFAULT 9,
  "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentPack_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StudentPack_student_id_key" ON "public"."StudentPack"("student_id");
ALTER TABLE "public"."StudentPack"
  ADD CONSTRAINT "StudentPack_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "public"."Student"("id") ON DELETE CASCADE;

-- Notifications
CREATE TABLE IF NOT EXISTS "public"."Notification" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "title"      TEXT NOT NULL,
  "message"    TEXT NOT NULL,
  "type"       TEXT NOT NULL,
  "read"       BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "public"."Notification"
  ADD CONSTRAINT "Notification_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE;
