-- CreateEnum
CREATE TYPE "PurchaseDocumentType" AS ENUM ('CREDITO_FISCAL', 'NOTA_CREDITO');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "nit" TEXT NOT NULL,
    "nrc" TEXT,
    "name" TEXT NOT NULL,
    "commercialName" TEXT,
    "activityCode" TEXT,
    "activityDescription" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "lastIssueDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseDocument" (
    "id" SERIAL NOT NULL,
    "type" "PurchaseDocumentType" NOT NULL,
    "generationCode" TEXT NOT NULL,
    "controlNumber" TEXT NOT NULL,
    "receptionStamp" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "issueDate" DATE NOT NULL,
    "issueTime" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "receiverNrc" TEXT NOT NULL,
    "operationCondition" INTEGER NOT NULL,
    "nonSubjectTotal" DECIMAL(12,2) NOT NULL,
    "exemptTotal" DECIMAL(12,2) NOT NULL,
    "taxedTotal" DECIMAL(12,2) NOT NULL,
    "discountTotal" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "ivaAmount" DECIMAL(12,2) NOT NULL,
    "ivaPerceived" DECIMAL(12,2) NOT NULL,
    "ivaWithheld" DECIMAL(12,2) NOT NULL,
    "incomeTaxWithheld" DECIMAL(12,2) NOT NULL,
    "operationTotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "warnings" JSONB,
    "rawJson" JSONB NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "voidedById" INTEGER,
    "importedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" INTEGER NOT NULL,

    CONSTRAINT "PurchaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseDocumentItem" (
    "id" SERIAL NOT NULL,
    "itemNumber" INTEGER NOT NULL,
    "itemType" INTEGER NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unitOfMeasure" INTEGER NOT NULL,
    "unitPrice" DECIMAL(14,6) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL,
    "nonSubjectSale" DECIMAL(12,2) NOT NULL,
    "exemptSale" DECIMAL(12,2) NOT NULL,
    "taxedSale" DECIMAL(12,2) NOT NULL,
    "relatedDocumentCode" TEXT,
    "documentId" INTEGER NOT NULL,

    CONSTRAINT "PurchaseDocumentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditNoteRelation" (
    "id" SERIAL NOT NULL,
    "relatedType" TEXT NOT NULL,
    "generationType" INTEGER NOT NULL,
    "relatedDocumentNumber" TEXT NOT NULL,
    "relatedIssueDate" DATE NOT NULL,
    "creditNoteId" INTEGER NOT NULL,
    "relatedDocumentId" INTEGER,

    CONSTRAINT "CreditNoteRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_nit_key" ON "Supplier"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseDocument_generationCode_key" ON "PurchaseDocument"("generationCode");

-- CreateIndex
CREATE INDEX "PurchaseDocument_issueDate_idx" ON "PurchaseDocument"("issueDate");

-- CreateIndex
CREATE INDEX "PurchaseDocument_supplierId_issueDate_idx" ON "PurchaseDocument"("supplierId", "issueDate");

-- CreateIndex
CREATE INDEX "CreditNoteRelation_relatedDocumentNumber_idx" ON "CreditNoteRelation"("relatedDocumentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNoteRelation_creditNoteId_relatedDocumentNumber_key" ON "CreditNoteRelation"("creditNoteId", "relatedDocumentNumber");

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocumentItem" ADD CONSTRAINT "PurchaseDocumentItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PurchaseDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNoteRelation" ADD CONSTRAINT "CreditNoteRelation_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "PurchaseDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNoteRelation" ADD CONSTRAINT "CreditNoteRelation_relatedDocumentId_fkey" FOREIGN KEY ("relatedDocumentId") REFERENCES "PurchaseDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
