CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "lessonId" INTEGER,
    "questionIds" INTEGER[] NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssessmentAttempt_userId_courseId_type_idx"
ON "AssessmentAttempt"("userId", "courseId", "type");

CREATE INDEX "AssessmentAttempt_userId_lessonId_type_consumedAt_idx"
ON "AssessmentAttempt"("userId", "lessonId", "type", "consumedAt");
