ALTER TABLE "public"."Absence"
  ADD COLUMN IF NOT EXISTS "medical_certificate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "apt_to_return"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "notes"               TEXT,
  ADD COLUMN IF NOT EXISTS "recorded_by"         TEXT;

-- Rendre excused non-null avec défaut
ALTER TABLE "public"."Absence" ALTER COLUMN "excused" SET DEFAULT false;
-- Rendre reason non-null avec défaut
ALTER TABLE "public"."Absence" ALTER COLUMN "reason" SET DEFAULT '';
