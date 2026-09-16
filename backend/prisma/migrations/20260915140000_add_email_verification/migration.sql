-- AlterTable
ALTER TABLE "User" ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "sector" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationToken" TEXT;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "quizQuestionCount" INTEGER NOT NULL DEFAULT 0;