/*
  Warnings:

  - You are about to alter the column `amount` on the `bank_transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to drop the column `user_id` on the `companies` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[company_id,code]` on the table `account_plan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cnpj]` on the table `accounting_firms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpf]` on the table `accounting_firms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cnpj]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[company_id,period_start,period_end,version]` on the table `dre` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `dre_group` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[order]` on the table `dre_group` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `accounting_firms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_id` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "account_plan" DROP CONSTRAINT "account_plan_company_id_fkey";

-- DropForeignKey
ALTER TABLE "account_plan" DROP CONSTRAINT "account_plan_dre_group_id_fkey";

-- DropForeignKey
ALTER TABLE "bank_statements" DROP CONSTRAINT "bank_statements_company_id_fkey";

-- DropForeignKey
ALTER TABLE "bank_transactions" DROP CONSTRAINT "bank_transactions_import_log_id_fkey";

-- DropForeignKey
ALTER TABLE "bank_transactions" DROP CONSTRAINT "bank_transactions_statement_id_fkey";

-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_accounting_firm_id_fkey";

-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_user_id_fkey";

-- DropForeignKey
ALTER TABLE "dre" DROP CONSTRAINT "dre_company_id_fkey";

-- DropForeignKey
ALTER TABLE "import_logs" DROP CONSTRAINT "import_logs_company_id_fkey";

-- DropIndex
DROP INDEX "companies_user_id_key";

-- AlterTable
ALTER TABLE "account_plan" ADD COLUMN     "code" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parent_account_id" TEXT,
ALTER COLUMN "dre_group_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "accounting_firms" ADD COLUMN     "address" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "audit_log" ADD COLUMN     "company_id" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "bank_statements" ADD COLUMN     "account_number" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "period_end" TIMESTAMP(3),
ADD COLUMN     "period_start" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "bank_transactions" ADD COLUMN     "classified_at" TIMESTAMP(3),
ADD COLUMN     "classified_by_user_id" TEXT,
ADD COLUMN     "document_number" TEXT,
ADD COLUMN     "is_classified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_reconciled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "transaction_type" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "user_id",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "owner_id" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "subscription_plan" TEXT NOT NULL DEFAULT 'basic',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "accounting_firm_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "dre" ADD COLUMN     "generated_by_user_id" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "import_logs" ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed',
ADD COLUMN     "transactions_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "can_create_companies" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "company_id" TEXT,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "user_company_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY['read']::TEXT[],
    "granted_by_user_id" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_company_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_company_access_user_id_company_id_key" ON "user_company_access"("user_id", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_plan_company_id_code_key" ON "account_plan"("company_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_firms_cnpj_key" ON "accounting_firms"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_firms_cpf_key" ON "accounting_firms"("cpf");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_company_id_idx" ON "audit_log"("company_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "bank_transactions_date_idx" ON "bank_transactions"("date");

-- CreateIndex
CREATE INDEX "bank_transactions_statement_id_idx" ON "bank_transactions"("statement_id");

-- CreateIndex
CREATE INDEX "bank_transactions_is_classified_idx" ON "bank_transactions"("is_classified");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "dre_company_id_period_start_period_end_version_key" ON "dre"("company_id", "period_start", "period_end", "version");

-- CreateIndex
CREATE UNIQUE INDEX "dre_group_name_key" ON "dre_group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dre_group_order_key" ON "dre_group"("order");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_accounting_firm_id_fkey" FOREIGN KEY ("accounting_firm_id") REFERENCES "accounting_firms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_access" ADD CONSTRAINT "user_company_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_access" ADD CONSTRAINT "user_company_access_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_access" ADD CONSTRAINT "user_company_access_granted_by_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_plan" ADD CONSTRAINT "account_plan_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_plan" ADD CONSTRAINT "account_plan_dre_group_id_fkey" FOREIGN KEY ("dre_group_id") REFERENCES "dre_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_plan" ADD CONSTRAINT "account_plan_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "account_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_logs" ADD CONSTRAINT "import_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "bank_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_import_log_id_fkey" FOREIGN KEY ("import_log_id") REFERENCES "import_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_classified_by_user_id_fkey" FOREIGN KEY ("classified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dre" ADD CONSTRAINT "dre_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dre" ADD CONSTRAINT "dre_generated_by_user_id_fkey" FOREIGN KEY ("generated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
