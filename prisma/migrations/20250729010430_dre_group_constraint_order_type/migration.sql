/*
  Warnings:

  - A unique constraint covering the columns `[order,type]` on the table `dre_group` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "dre_group_order_type_key" ON "dre_group"("order", "type");
