-- Ajout des champs genre, état civil et nom de famille sur Parent
ALTER TABLE "public"."Parent"
  ADD COLUMN IF NOT EXISTS "gender"         TEXT NOT NULL DEFAULT 'father',
  ADD COLUMN IF NOT EXISTS "marital_status" TEXT NOT NULL DEFAULT 'alive',
  ADD COLUMN IF NOT EXISTS "family_name"    TEXT;

-- Rendre address optionnel (était NOT NULL)
ALTER TABLE "public"."Parent"
  ALTER COLUMN "address" DROP NOT NULL;
