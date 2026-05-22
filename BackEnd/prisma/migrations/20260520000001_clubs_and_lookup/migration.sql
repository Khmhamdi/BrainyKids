-- Update Club table: rename membership_fee to price, add type and is_active
ALTER TABLE "Club" RENAME COLUMN "membership_fee" TO "price";
ALTER TABLE "Club" ALTER COLUMN "description" DROP NOT NULL;
ALTER TABLE "Club" ALTER COLUMN "age_group" DROP NOT NULL;
ALTER TABLE "Club" ADD COLUMN IF NOT EXISTS "type"      TEXT    NOT NULL DEFAULT 'regulier';
ALTER TABLE "Club" ADD COLUMN IF NOT EXISTS "is_active"  BOOLEAN NOT NULL DEFAULT true;

-- Create AppLookup table for dynamic dropdowns
CREATE TABLE "AppLookup" (
  "id"         TEXT    NOT NULL,
  "category"   TEXT    NOT NULL,
  "code"       TEXT    NOT NULL,
  "label"      TEXT    NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active"  BOOLEAN NOT NULL DEFAULT true,
  "meta"       JSONB,
  CONSTRAINT "AppLookup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AppLookup_category_code_key" UNIQUE ("category", "code")
);

-- Add clubs_json to SummerPack for dynamic club selection
ALTER TABLE "SummerPack" ADD COLUMN IF NOT EXISTS "clubs_json" JSONB NOT NULL DEFAULT '[]';

-- Seed initial lookup data
INSERT INTO "AppLookup" ("id","category","code","label","sort_order","is_active")
VALUES
  -- Régimes
  (gen_random_uuid(),'regime','journee_complete','Journée complète',1,true),
  (gen_random_uuid(),'regime','demi_matin','Demi-journée matin',2,true),
  (gen_random_uuid(),'regime','demi_apres_midi','Demi-journée après-midi',3,true),
  -- Groupes d'âge
  (gen_random_uuid(),'age_group','3 ans','3 ans',1,true),
  (gen_random_uuid(),'age_group','4 ans','4 ans',2,true),
  (gen_random_uuid(),'age_group','5 ans','5 ans',3,true),
  -- Fonctions du personnel
  (gen_random_uuid(),'fonction','enseignante','Enseignante',1,true),
  (gen_random_uuid(),'fonction','femme_de_service','Femme de service',2,true),
  (gen_random_uuid(),'fonction','autre','Autre personnel',3,true);
