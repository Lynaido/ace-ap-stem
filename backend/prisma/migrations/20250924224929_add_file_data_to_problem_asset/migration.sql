-- AlterTable
ALTER TABLE "problem_assets" ADD COLUMN     "fileData" BYTEA,
ALTER COLUMN "problemId" DROP NOT NULL;
