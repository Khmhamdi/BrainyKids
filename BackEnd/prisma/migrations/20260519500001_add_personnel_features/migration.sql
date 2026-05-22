-- Rendre user_id optionnel (personnel sans compte)
ALTER TABLE "Teacher" ALTER COLUMN "user_id" DROP NOT NULL;

-- Rendre qualification optionnel
ALTER TABLE "Teacher" ALTER COLUMN "qualification" DROP NOT NULL;

-- Nom direct pour le personnel sans compte utilisateur
ALTER TABLE "Teacher" ADD COLUMN "full_name" TEXT;

-- Fonction dans l'établissement
ALTER TABLE "Teacher" ADD COLUMN "fonction" TEXT NOT NULL DEFAULT 'enseignante';

-- Salaire mensuel brut
ALTER TABLE "Teacher" ADD COLUMN "monthly_salary" DECIMAL(10,2);

-- Table des paiements de salaires mensuels
CREATE TABLE "StaffSalaryPayment" (
    "id"         TEXT          NOT NULL,
    "teacher_id" TEXT          NOT NULL,
    "month"      INTEGER       NOT NULL,
    "year"       INTEGER       NOT NULL,
    "amount"     DECIMAL(10,2) NOT NULL,
    "paid_at"    TIMESTAMP(3),
    "notes"      TEXT,
    "created_at" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffSalaryPayment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StaffSalaryPayment"
    ADD CONSTRAINT "StaffSalaryPayment_teacher_id_fkey"
    FOREIGN KEY ("teacher_id") REFERENCES "Teacher"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
