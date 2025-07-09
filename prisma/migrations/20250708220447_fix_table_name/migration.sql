/*
  Warnings:

  - You are about to drop the `comnpanies` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `data` to the `dre` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `dre_group` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "account_plan" DROP CONSTRAINT "account_plan_company_id_fkey";

-- DropForeignKey
ALTER TABLE "bank_statements" DROP CONSTRAINT "bank_statements_company_id_fkey";

-- DropForeignKey
ALTER TABLE "bank_transactions" DROP CONSTRAINT "bank_transactions_account_id_fkey";

-- DropForeignKey
ALTER TABLE "comnpanies" DROP CONSTRAINT "comnpanies_accounting_firm_id_fkey";

-- DropForeignKey
ALTER TABLE "comnpanies" DROP CONSTRAINT "comnpanies_user_id_fkey";

-- DropForeignKey
ALTER TABLE "dre" DROP CONSTRAINT "dre_company_id_fkey";

-- DropForeignKey
ALTER TABLE "import_logs" DROP CONSTRAINT "import_logs_company_id_fkey";

-- AlterTable
ALTER TABLE "audit_log" ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "bank_transactions" ALTER COLUMN "account_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "dre" ADD COLUMN     "data" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "dre_group" ADD COLUMN     "type" TEXT NOT NULL;

-- DropTable
DROP TABLE "comnpanies";

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "user_id" TEXT NOT NULL,
    "accounting_firm_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_user_id_key" ON "companies"("user_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_accounting_firm_id_fkey" FOREIGN KEY ("accounting_firm_id") REFERENCES "accounting_firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_logs" ADD CONSTRAINT "import_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_plan" ADD CONSTRAINT "account_plan_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dre" ADD CONSTRAINT "dre_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
