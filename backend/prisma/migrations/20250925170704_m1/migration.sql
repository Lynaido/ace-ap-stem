-- AlterTable
ALTER TABLE "saved_items" ADD COLUMN     "folderId" TEXT;

-- AddForeignKey
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
