ALTER TABLE "solutions" ADD COLUMN "context" JSONB;
ALTER TABLE "hints" ADD COLUMN "context" JSONB;
ALTER TABLE "concept_notes" ADD COLUMN "structuredContent" JSONB;
ALTER TABLE "concept_notes" ADD COLUMN "context" JSONB;

UPDATE "saved_items" AS saved
SET "problemId" = solution."problemId"
FROM "solutions" AS solution
WHERE saved."solutionId" = solution."id"
  AND saved."problemId" IS NULL;

UPDATE "saved_items" AS saved
SET "problemId" = hint."problemId"
FROM "hints" AS hint
WHERE saved."hintId" = hint."id"
  AND saved."problemId" IS NULL;

UPDATE "saved_items" AS saved
SET "problemId" = concept."problemId"
FROM "concept_notes" AS concept
WHERE saved."conceptNoteId" = concept."id"
  AND saved."problemId" IS NULL;
