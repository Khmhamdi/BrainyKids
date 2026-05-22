-- 1. Ajouter regime sur Student
ALTER TABLE "public"."Student" ADD COLUMN IF NOT EXISTS "regime" TEXT NOT NULL DEFAULT 'journee_complete';

-- 2. Ajouter juin (mois 6) dans StudentPack + tarif_base
ALTER TABLE "public"."StudentPack" ADD COLUMN IF NOT EXISTS "regime" TEXT NOT NULL DEFAULT 'journee_complete';
ALTER TABLE "public"."StudentPack" ADD COLUMN IF NOT EXISTS "tarif_base" FLOAT NOT NULL DEFAULT 0;
ALTER TABLE "public"."StudentPack" ADD COLUMN IF NOT EXISTS "end_month" INT NOT NULL DEFAULT 6;

-- 3. Table ExternalStudent pour clubs d'été
CREATE TABLE IF NOT EXISTS "public"."ExternalStudent" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'M',
    "parent_name" TEXT NOT NULL,
    "parent_phone" TEXT NOT NULL,
    "parent_email" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExternalStudent_pkey" PRIMARY KEY ("id")
);

-- 4. Table SummerPack pour clubs d'été
CREATE TABLE IF NOT EXISTS "public"."SummerPack" (
    "id" TEXT NOT NULL,
    "student_id" TEXT,
    "external_student_id" TEXT,
    "month" INT NOT NULL,
    "year" INT NOT NULL,
    "pack_amount" FLOAT NOT NULL DEFAULT 0,
    "langue_fr" BOOLEAN NOT NULL DEFAULT false,
    "langue_fr_amount" FLOAT NOT NULL DEFAULT 0,
    "langue_en" BOOLEAN NOT NULL DEFAULT false,
    "langue_en_amount" FLOAT NOT NULL DEFAULT 0,
    "robotique" BOOLEAN NOT NULL DEFAULT false,
    "robotique_amount" FLOAT NOT NULL DEFAULT 0,
    "total_amount" FLOAT NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SummerPack_pkey" PRIMARY KEY ("id")
);
