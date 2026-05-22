-- Ajout du champ gender au modèle Student
ALTER TABLE "public"."Student" ADD COLUMN IF NOT EXISTS "gender" TEXT NOT NULL DEFAULT 'M';
