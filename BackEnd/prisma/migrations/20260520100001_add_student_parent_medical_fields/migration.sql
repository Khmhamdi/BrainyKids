-- AddColumn: Student — identity & scheduling fields
ALTER TABLE "Student" ADD COLUMN "lieu_naissance"     TEXT;
ALTER TABLE "Student" ADD COLUMN "nationalite"        TEXT DEFAULT 'Tunisienne';
ALTER TABLE "Student" ADD COLUMN "numero_inscription" TEXT;
ALTER TABLE "Student" ADD COLUMN "heure_arrivee"      TEXT;
ALTER TABLE "Student" ADD COLUMN "heure_depart"       TEXT;
ALTER TABLE "Student" ADD COLUMN "transport_mode"     TEXT DEFAULT 'parent';

-- AddColumn: Parent — CIN & profession
ALTER TABLE "Parent" ADD COLUMN "cin"        TEXT;
ALTER TABLE "Parent" ADD COLUMN "profession" TEXT;

-- AlterColumn: MedicalFile — make legacy fields nullable (add defaults)
ALTER TABLE "MedicalFile" ALTER COLUMN "allergies"          SET DEFAULT '';
ALTER TABLE "MedicalFile" ALTER COLUMN "chronic_conditions" SET DEFAULT '';
ALTER TABLE "MedicalFile" ALTER COLUMN "vaccinations"       SET DEFAULT '';
ALTER TABLE "MedicalFile" ALTER COLUMN "emergency_contact"  SET DEFAULT '';

-- AddColumn: MedicalFile — structured medical fields
ALTER TABLE "MedicalFile" ADD COLUMN "has_allergies"          BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MedicalFile" ADD COLUMN "allergies_detail"       TEXT;
ALTER TABLE "MedicalFile" ADD COLUMN "traitement"             BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MedicalFile" ADD COLUMN "traitement_detail"      TEXT;
ALTER TABLE "MedicalFile" ADD COLUMN "condition_particuliere" TEXT;
ALTER TABLE "MedicalFile" ADD COLUMN "medecin_traitant"       TEXT;
ALTER TABLE "MedicalFile" ADD COLUMN "tel_medecin"            TEXT;
ALTER TABLE "MedicalFile" ADD COLUMN "email_medecin"          TEXT;
