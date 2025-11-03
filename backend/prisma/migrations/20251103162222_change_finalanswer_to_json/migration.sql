/*
  Warnings:

  - The `finalAnswer` column on the `solutions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "solutions" DROP COLUMN "finalAnswer",
ADD COLUMN     "finalAnswer" JSONB;

-- CreateIndex
CREATE INDEX "ai_jobs_status_idx" ON "ai_jobs"("status");

-- CreateIndex
CREATE INDEX "ai_jobs_type_idx" ON "ai_jobs"("type");

-- CreateIndex
CREATE INDEX "ai_jobs_createdAt_idx" ON "ai_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "chat_threads_userId_idx" ON "chat_threads"("userId");

-- CreateIndex
CREATE INDEX "chat_threads_updatedAt_idx" ON "chat_threads"("updatedAt");

-- CreateIndex
CREATE INDEX "concept_notes_problemId_idx" ON "concept_notes"("problemId");

-- CreateIndex
CREATE INDEX "events_userId_idx" ON "events"("userId");

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "events"("createdAt");

-- CreateIndex
CREATE INDEX "folders_userId_idx" ON "folders"("userId");

-- CreateIndex
CREATE INDEX "hints_problemId_idx" ON "hints"("problemId");

-- CreateIndex
CREATE INDEX "messages_threadId_idx" ON "messages"("threadId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "notes_userId_idx" ON "notes"("userId");

-- CreateIndex
CREATE INDEX "notes_folderId_idx" ON "notes"("folderId");

-- CreateIndex
CREATE INDEX "problem_assets_problemId_idx" ON "problem_assets"("problemId");

-- CreateIndex
CREATE INDEX "problems_userId_idx" ON "problems"("userId");

-- CreateIndex
CREATE INDEX "problems_status_idx" ON "problems"("status");

-- CreateIndex
CREATE INDEX "problems_subject_idx" ON "problems"("subject");

-- CreateIndex
CREATE INDEX "problems_userId_status_idx" ON "problems"("userId", "status");

-- CreateIndex
CREATE INDEX "problems_createdAt_idx" ON "problems"("createdAt");

-- CreateIndex
CREATE INDEX "saved_items_userId_idx" ON "saved_items"("userId");

-- CreateIndex
CREATE INDEX "saved_items_problemId_idx" ON "saved_items"("problemId");

-- CreateIndex
CREATE INDEX "saved_items_folderId_idx" ON "saved_items"("folderId");

-- CreateIndex
CREATE INDEX "saved_items_starred_idx" ON "saved_items"("starred");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "solutions_problemId_idx" ON "solutions"("problemId");

-- CreateIndex
CREATE INDEX "study_sessions_userId_idx" ON "study_sessions"("userId");

-- CreateIndex
CREATE INDEX "study_sessions_problemId_idx" ON "study_sessions"("problemId");
