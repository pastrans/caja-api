-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "unitOfMeasure" INTEGER NOT NULL,
    "ref" TEXT NOT NULL,
    "targetUnitOfMeasure" INTEGER NOT NULL,
    "targetRef" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSuggestionDismissal" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "signature" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSuggestionDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariant_supplierId_targetUnitOfMeasure_targetRef_idx" ON "ProductVariant"("supplierId", "targetUnitOfMeasure", "targetRef");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_supplierId_unitOfMeasure_ref_key" ON "ProductVariant"("supplierId", "unitOfMeasure", "ref");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSuggestionDismissal_supplierId_signature_key" ON "ProductSuggestionDismissal"("supplierId", "signature");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSuggestionDismissal" ADD CONSTRAINT "ProductSuggestionDismissal_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSuggestionDismissal" ADD CONSTRAINT "ProductSuggestionDismissal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

