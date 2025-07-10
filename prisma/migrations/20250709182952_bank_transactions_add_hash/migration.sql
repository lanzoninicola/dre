/*
  Warnings:

  - A unique constraint covering the columns `[transaction_hash]` on the table `bank_transactions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `transaction_hash` to the `bank_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "accounting_firms" ADD COLUMN     "is_autonomous" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "bank_transactions" ADD COLUMN     "transaction_hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_transaction_hash_key" ON "bank_transactions"("transaction_hash");

-- CreateIndex
CREATE INDEX "bank_transactions_transaction_hash_idx" ON "bank_transactions"("transaction_hash");
