/*
  Warnings:

  - You are about to drop the column `owner_id` on the `companies` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[company_id,name]` on the table `account_plan` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_owner_id_fkey";

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "owner_id",
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "dre_group" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "account_plan_company_id_idx" ON "account_plan"("company_id");

-- CreateIndex
CREATE INDEX "account_plan_dre_group_id_idx" ON "account_plan"("dre_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_plan_company_id_name_key" ON "account_plan"("company_id", "name");

-- CreateIndex
CREATE INDEX "companies_userId_idx" ON "companies"("userId");

-- CreateIndex
CREATE INDEX "companies_accounting_firm_id_idx" ON "companies"("accounting_firm_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
