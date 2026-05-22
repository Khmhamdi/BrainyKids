-- Replace autorisation_sortie with copie_cin_pere / copie_cin_mere
ALTER TABLE "RegistrationChecklist" ADD COLUMN "copie_cin_pere" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RegistrationChecklist" ADD COLUMN "copie_cin_mere" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RegistrationChecklist" DROP COLUMN IF EXISTS "autorisation_sortie";
