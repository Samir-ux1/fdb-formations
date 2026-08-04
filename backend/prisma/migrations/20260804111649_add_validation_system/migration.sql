-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 70.0;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "finalScore" DOUBLE PRECISION,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "LessonProgress" ADD COLUMN     "score" DOUBLE PRECISION;
