-- AlterTable
ALTER TABLE "Project" ADD COLUMN "notes" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeliveryVideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "label" TEXT NOT NULL DEFAULT 'Vídeo Final',
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryVideo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryVideo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DeliveryVideo" ("fileName", "id", "label", "projectId", "size", "storedName", "uploadedAt", "uploadedById") SELECT "fileName", "id", "label", "projectId", "size", "storedName", "uploadedAt", "uploadedById" FROM "DeliveryVideo";
DROP TABLE "DeliveryVideo";
ALTER TABLE "new_DeliveryVideo" RENAME TO "DeliveryVideo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
