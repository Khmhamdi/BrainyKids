-- Ajouter is_active sur User (par défaut true = compte actif)
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
