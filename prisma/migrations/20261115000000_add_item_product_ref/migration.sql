-- AlterTable
ALTER TABLE "PurchaseDocumentItem" ADD COLUMN     "productName" TEXT,
ADD COLUMN     "productRef" TEXT;

-- Calcula el producto de las líneas ya importadas con las mismas reglas de ProductRefHelper
-- (src/domain/helpers/product-ref.helper.ts). Las líneas nuevas lo traen calculado desde la importación.
UPDATE "PurchaseDocumentItem" SET
  "productRef" = CASE
    WHEN nullif(btrim("code"), '') IS NOT NULL AND btrim("code") <> 'PLU:' THEN upper(btrim("code"))
    WHEN "description" ~ '^\s*\d{6,}\s*\|' THEN btrim(split_part("description", '|', 1))
    ELSE upper(regexp_replace(btrim(split_part("description", '|', 1)), '\s+', ' ', 'g'))
  END,
  "productName" = CASE
    WHEN nullif(btrim("code"), '') IS NOT NULL AND btrim("code") <> 'PLU:' THEN btrim("description")
    WHEN "description" ~ '^\s*\d{6,}\s*\|' THEN coalesce(
      nullif(btrim(split_part("description", '|', 3)), ''),
      btrim(split_part("description", '|', 2))
    )
    ELSE btrim(split_part("description", '|', 1))
  END;
