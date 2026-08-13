/*
  Warnings:

  - You are about to drop the column `date` on the `Closing` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Closing" DROP CONSTRAINT "Closing_cashRegisterRecordId_fkey";

-- AlterTable
ALTER TABLE "Closing" DROP COLUMN "date",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "totalCashInOut" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalExpected" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalTransactions" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "denominations" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Closing" ADD CONSTRAINT "Closing_cashRegisterRecordId_fkey" FOREIGN KEY ("cashRegisterRecordId") REFERENCES "CashRegisterRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
