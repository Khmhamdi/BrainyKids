-- AlterTable Student
ALTER TABLE "public"."Student" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."Student" ADD COLUMN "archived_at" TIMESTAMP(3);
ALTER TABLE "public"."Student" ADD COLUMN "archived_by" TEXT;
ALTER TABLE "public"."Student" ADD COLUMN "photo_url" TEXT;

-- AlterTable Parent
ALTER TABLE "public"."Parent" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."Parent" ADD COLUMN "archived_at" TIMESTAMP(3);
ALTER TABLE "public"."Parent" ADD COLUMN "archived_by" TEXT;

-- AlterTable RegistrationChecklist: add new fields
ALTER TABLE "public"."RegistrationChecklist" ADD COLUMN "photo_identite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."RegistrationChecklist" ADD COLUMN "extrait_naissance" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."RegistrationChecklist" ADD COLUMN "certificat_medical" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."RegistrationChecklist" ADD COLUMN "fiche_renseignement_signee" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."RegistrationChecklist" ADD COLUMN "vaccinations_a_jour" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."RegistrationChecklist" ADD COLUMN "autorisation_sortie" BOOLEAN NOT NULL DEFAULT false;

-- Remove old columns
ALTER TABLE "public"."RegistrationChecklist" DROP COLUMN "birth_certificate";
ALTER TABLE "public"."RegistrationChecklist" DROP COLUMN "immunization_record";
ALTER TABLE "public"."RegistrationChecklist" DROP COLUMN "proof_of_address";
ALTER TABLE "public"."RegistrationChecklist" DROP COLUMN "photo";

-- Set default for last_update
ALTER TABLE "public"."RegistrationChecklist" ALTER COLUMN "last_update" SET DEFAULT NOW();
