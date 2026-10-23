-- Solo puede existir una caja abierta a la vez.
-- Si esta migración falla, hay más de una caja con status = 'OPEN': ciérralas antes de desplegar.

-- CreateIndex
CREATE UNIQUE INDEX "CashRegisterRecord_single_open_key" ON "CashRegisterRecord"("status") WHERE (status = 'OPEN');
