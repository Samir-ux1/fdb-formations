/*
  Warnings:

  - You are about to drop the column `finalScore` on the `Enrollment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "finalScore",
ADD COLUMN     "examScore" DOUBLE PRECISION,
ADD COLUMN     "finalGrade" DOUBLE PRECISION,
ADD COLUMN     "isValidated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quizScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "courseId" INTEGER;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
