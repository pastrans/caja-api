-- DropForeignKey
ALTER TABLE "Closing" DROP CONSTRAINT "Closing_cashRegisterRecordId_fkey";

-- AddForeignKey
ALTER TABLE "Closing" ADD CONSTRAINT "Closing_cashRegisterRecordId_fkey" FOREIGN KEY ("cashRegisterRecordId") REFERENCES "CashRegisterRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
