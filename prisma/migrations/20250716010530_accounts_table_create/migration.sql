/*
  Warnings:

  - You are about to drop the `account_plan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "account_plan" DROP CONSTRAINT "account_plan_company_id_fkey";

-- DropForeignKey
ALTER TABLE "account_plan" DROP CONSTRAINT "account_plan_dre_group_id_fkey";

-- DropForeignKey
ALTER TABLE "account_plan" DROP CONSTRAINT "account_plan_parent_account_id_fkey";

-- DropForeignKey
ALTER TABLE "bank_transactions" DROP CONSTRAINT "bank_transactions_account_id_fkey";

-- DropTable
DROP TABLE "account_plan";

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT NOT NULL,
    "dre_group_id" TEXT,
    "parent_account_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_company_id_idx" ON "accounts"("company_id");

-- CreateIndex
CREATE INDEX "accounts_dre_group_id_idx" ON "accounts"("dre_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_company_id_code_key" ON "accounts"("company_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_company_id_name_key" ON "accounts"("company_id", "name");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_dre_group_id_fkey" FOREIGN KEY ("dre_group_id") REFERENCES "dre_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
