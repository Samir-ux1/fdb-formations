-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "timeLimitDays" INTEGER DEFAULT 30;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "fieldGrade" DOUBLE PRECISION;
