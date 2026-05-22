-- CreateTable
CREATE TABLE "StudentNote" (
    "id"         TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content"    TEXT NOT NULL,
    "author"     TEXT,

    CONSTRAINT "StudentNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudentNote" ADD CONSTRAINT "StudentNote_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "Student"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
