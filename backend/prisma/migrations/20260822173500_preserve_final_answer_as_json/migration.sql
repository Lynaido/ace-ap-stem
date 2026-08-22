-- Preserve existing text answers while aligning the production column with the
-- Prisma Json type. `to_jsonb` stores each existing text value as a valid JSON
-- string instead of dropping the column and its data.
ALTER TABLE "solutions"
ALTER COLUMN "finalAnswer" TYPE JSONB
USING to_jsonb("finalAnswer");
