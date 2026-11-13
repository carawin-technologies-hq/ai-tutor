-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'PARENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('mcq', 'multi', 'tf', 'fill', 'short', 'long', 'numerical', 'case', 'assertion', 'competency');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('APPROVED', 'IN_REVIEW', 'DRAFT');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('CHAPTER_TEST', 'UNIT_TEST', 'SAMPLE_PAPER', 'REVISION_TEST');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('PUBLISHED', 'DRAFT');

-- CreateEnum
CREATE TYPE "AttemptMode" AS ENUM ('PRACTICE', 'TEST');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('correct', 'partial', 'wrong', 'skipped');

-- CreateEnum
CREATE TYPE "LessonState" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DocKind" AS ENUM ('TEXTBOOK', 'NOTES', 'WORKSHEET', 'PDF');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TaskKind" AS ENUM ('STUDY', 'HOMEWORK', 'REVISION', 'TEST');

-- CreateEnum
CREATE TYPE "ActivityKind" AS ENUM ('LESSON', 'PRACTICE', 'TEST', 'CHAT', 'VIDEO');

-- CreateEnum
CREATE TYPE "NoticeKind" AS ENUM ('info', 'success', 'warning');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('STUDENT', 'TEACHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "userId" TEXT NOT NULL,
    "age" TEXT,
    "classLevel" TEXT NOT NULL DEFAULT '8',
    "board" TEXT NOT NULL DEFAULT 'CBSE',
    "session" TEXT,
    "school" TEXT,
    "medium" TEXT,
    "subjects" TEXT[],
    "language" TEXT NOT NULL DEFAULT 'English',
    "styles" TEXT[],
    "teachingStyle" TEXT,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "inviteCode" TEXT NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ParentLink" (
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentLink_pkey" PRIMARY KEY ("parentId","studentId")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "board" TEXT NOT NULL,
    "classLevel" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objectives" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "topicId" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "type" "QuestionType" NOT NULL,
    "text" TEXT NOT NULL,
    "passage" TEXT,
    "options" TEXT[],
    "answer" JSONB NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "marks" INTEGER NOT NULL DEFAULT 1,
    "keywords" TEXT[],
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "board" TEXT NOT NULL,
    "classLevel" TEXT NOT NULL,
    "subject" TEXT,
    "minutes" INTEGER NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("assessmentId","questionId")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "mode" "AttemptMode" NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "minutes" INTEGER,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptItem" (
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "response" JSONB,
    "verdict" "Verdict",
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSec" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "AttemptItem_pkey" PRIMARY KEY ("attemptId","questionId")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "beats" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "state" "LessonState" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("studentId","lessonId")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "chapterId" TEXT,
    "topic" TEXT,
    "language" TEXT NOT NULL DEFAULT 'English',
    "duration" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "url" TEXT,
    "objectives" TEXT[],
    "takeaways" TEXT[],
    "questions" JSONB NOT NULL DEFAULT '[]',
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryDoc" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "kind" "DocKind" NOT NULL,
    "subject" TEXT NOT NULL,
    "chapter" TEXT,
    "pages" INTEGER NOT NULL DEFAULT 1,
    "content" TEXT[],
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryFavorite" (
    "userId" TEXT NOT NULL,
    "docId" TEXT NOT NULL,

    CONSTRAINT "LibraryFavorite_pkey" PRIMARY KEY ("userId","docId")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "chapter" TEXT,
    "language" TEXT NOT NULL DEFAULT 'English',
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "body" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerTask" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "kind" "TaskKind" NOT NULL DEFAULT 'STUDY',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlannerTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kind" "ActivityKind" NOT NULL,
    "minutes" DOUBLE PRECISION NOT NULL,
    "summary" TEXT NOT NULL,
    "subject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "kind" "NoticeKind" NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'General',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "text" TEXT,
    "blocks" JSONB,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_inviteCode_key" ON "StudentProfile"("inviteCode");

-- CreateIndex
CREATE INDEX "ParentLink_studentId_idx" ON "ParentLink"("studentId");

-- CreateIndex
CREATE INDEX "Chapter_board_classLevel_subject_idx" ON "Chapter"("board", "classLevel", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_board_classLevel_subject_name_key" ON "Chapter"("board", "classLevel", "subject", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_chapterId_name_key" ON "Topic"("chapterId", "name");

-- CreateIndex
CREATE INDEX "Question_chapterId_status_idx" ON "Question"("chapterId", "status");

-- CreateIndex
CREATE INDEX "Attempt_studentId_submittedAt_idx" ON "Attempt"("studentId", "submittedAt");

-- CreateIndex
CREATE INDEX "LibraryDoc_ownerId_idx" ON "LibraryDoc"("ownerId");

-- CreateIndex
CREATE INDEX "PlannerTask_studentId_date_idx" ON "PlannerTask"("studentId", "date");

-- CreateIndex
CREATE INDEX "Activity_studentId_createdAt_idx" ON "Activity"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Conversation_studentId_updatedAt_idx" ON "Conversation"("studentId", "updatedAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentLink" ADD CONSTRAINT "ParentLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentLink" ADD CONSTRAINT "ParentLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptItem" ADD CONSTRAINT "AttemptItem_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptItem" ADD CONSTRAINT "AttemptItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryDoc" ADD CONSTRAINT "LibraryDoc_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryFavorite" ADD CONSTRAINT "LibraryFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryFavorite" ADD CONSTRAINT "LibraryFavorite_docId_fkey" FOREIGN KEY ("docId") REFERENCES "LibraryDoc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerTask" ADD CONSTRAINT "PlannerTask_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
