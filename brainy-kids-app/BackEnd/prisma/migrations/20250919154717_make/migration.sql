-- DropForeignKey
ALTER TABLE "public"."Class" DROP CONSTRAINT "Class_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Student" DROP CONSTRAINT "Student_schedule_id_fkey";

-- AlterTable
ALTER TABLE "public"."Class" ALTER COLUMN "schedule_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Student" ALTER COLUMN "schedule_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Class" ADD CONSTRAINT "Class_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
