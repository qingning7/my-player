-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "trackIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
