-- Los montos pasan de DOUBLE PRECISION a DECIMAL(12,2).
-- ROUND(...::numeric, 2) conserva el valor redondeado a centavos (sin pérdida para montos monetarios).

-- AlterTable
ALTER TABLE "Opening"
  ALTER COLUMN "cash" SET DATA TYPE DECIMAL(12,2) USING ROUND("cash"::numeric, 2);

-- AlterTable
ALTER TABLE "Closing"
  ALTER COLUMN "cashProvided" SET DATA TYPE DECIMAL(12,2) USING ROUND("cashProvided"::numeric, 2),
  ALTER COLUMN "difference" SET DATA TYPE DECIMAL(12,2) USING ROUND("difference"::numeric, 2),
  ALTER COLUMN "totalTransactions" SET DATA TYPE DECIMAL(12,2) USING ROUND("totalTransactions"::numeric, 2),
  ALTER COLUMN "totalCashInOut" SET DATA TYPE DECIMAL(12,2) USING ROUND("totalCashInOut"::numeric, 2),
  ALTER COLUMN "totalExpected" SET DATA TYPE DECIMAL(12,2) USING ROUND("totalExpected"::numeric, 2);

-- AlterTable
ALTER TABLE "CashInOutRecord"
  ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2);

-- AlterTable
ALTER TABLE "TransactionRecord"
  ALTER COLUMN "amountToCharge" SET DATA TYPE DECIMAL(12,2) USING ROUND("amountToCharge"::numeric, 2),
  ALTER COLUMN "cashProvided" SET DATA TYPE DECIMAL(12,2) USING ROUND("cashProvided"::numeric, 2),
  ALTER COLUMN "changeReturned" SET DATA TYPE DECIMAL(12,2) USING ROUND("changeReturned"::numeric, 2);
