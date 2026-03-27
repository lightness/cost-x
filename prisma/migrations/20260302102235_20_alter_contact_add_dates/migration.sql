-- AlterEnum
ALTER TYPE "ContactStatus" ADD VALUE 'REMOVED';

-- AlterTable
ALTER TABLE "contact" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "invitedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "removedAt" TIMESTAMP(3);
