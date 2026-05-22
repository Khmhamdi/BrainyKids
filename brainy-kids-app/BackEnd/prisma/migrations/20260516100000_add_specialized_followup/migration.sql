-- CreateTable SpecializedFollowUp
CREATE TABLE "public"."SpecializedFollowUp" (
    "id"                    TEXT NOT NULL,
    "student_id"            TEXT NOT NULL,
    "type"                  TEXT NOT NULL,
    "specialist_name"       TEXT NOT NULL,
    "specialist_phone"      TEXT,
    "specialist_email"      TEXT,
    "frequency"             TEXT,
    "class_recommendations" TEXT,
    "notes"                 TEXT,
    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecializedFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpecializedFollowUp_student_id_key" ON "public"."SpecializedFollowUp"("student_id");

-- AddForeignKey
ALTER TABLE "public"."SpecializedFollowUp"
    ADD CONSTRAINT "SpecializedFollowUp_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "public"."Student"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
