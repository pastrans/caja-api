/*
  Warnings:

  - You are about to drop the `todo` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CashRegisterStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "CashInOutType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CASHIER');

-- DropTable
DROP TABLE "todo";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CASHIER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashRegisterRecord" (
    "id" SERIAL NOT NULL,
    "status" "CashRegisterStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashRegisterRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opening" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cash" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "denominations" JSONB NOT NULL,
    "cashRegisterRecordId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Opening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Closing" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cashProvided" DOUBLE PRECISION NOT NULL,
    "difference" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "denominations" JSONB NOT NULL,
    "cashRegisterRecordId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Closing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashInOutRecord" (
    "id" SERIAL NOT NULL,
    "type" "CashInOutType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "cashRegisterRecordId" INTEGER NOT NULL,

    CONSTRAINT "CashInOutRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionRecord" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountToCharge" DOUBLE PRECISION NOT NULL,
    "cashProvided" DOUBLE PRECISION NOT NULL,
    "changeReturned" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "denominations" JSONB NOT NULL,
    "cashRegisterRecordId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,

    CONSTRAINT "TransactionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Opening_cashRegisterRecordId_key" ON "Opening"("cashRegisterRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "Closing_cashRegisterRecordId_key" ON "Closing"("cashRegisterRecordId");

-- AddForeignKey
ALTER TABLE "Opening" ADD CONSTRAINT "Opening_cashRegisterRecordId_fkey" FOREIGN KEY ("cashRegisterRecordId") REFERENCES "CashRegisterRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opening" ADD CONSTRAINT "Opening_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Closing" ADD CONSTRAINT "Closing_cashRegisterRecordId_fkey" FOREIGN KEY ("cashRegisterRecordId") REFERENCES "CashRegisterRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Closing" ADD CONSTRAINT "Closing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashInOutRecord" ADD CONSTRAINT "CashInOutRecord_cashRegisterRecordId_fkey" FOREIGN KEY ("cashRegisterRecordId") REFERENCES "CashRegisterRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionRecord" ADD CONSTRAINT "TransactionRecord_cashRegisterRecordId_fkey" FOREIGN KEY ("cashRegisterRecordId") REFERENCES "CashRegisterRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionRecord" ADD CONSTRAINT "TransactionRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
