// ============================================================================
// 3. IMPORT/EXPORT - Operações de importação e exportação
// ============================================================================

import { getCompanyById } from "~/domain/company/company.server";
import { getAccountPlanByCompany } from "~/domain/transactions/transactions.server";
import {
  User,
  ServiceResult,
  ImportAccountData,
  ExportFormat,
} from "../account-plan.types";
import { AccountPlanCRUDService } from "./account-plan-crud.service.server";
import { createAccountPlanService } from "./accoun-plan.service.server";

// app/services/account-plan/AccountPlanImportExportService.ts
export class AccountPlanImportExportService {
  constructor(private user: User) {}

  async importAccounts(
    companyId: string,
    accounts: ImportAccountData[]
  ): Promise<ServiceResult> {
    try {
      await this.checkPermissions(companyId);

      const results = [];
      const errors = [];

      for (const accountData of accounts) {
        try {
          const crudService = createAccountPlanService(this.user);
          const result = await crudService.create(companyId, accountData);

          if (result.success) {
            results.push(result.data);
          } else {
            errors.push({ account: accountData.name, error: result.error });
          }
        } catch (error: any) {
          errors.push({ account: accountData.name, error: error.message });
        }
      }

      return {
        success: errors.length === 0,
        data: { imported: results, errors },
        message: `${results.length} contas importadas. ${errors.length} erros.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro na importação",
      };
    }
  }

  async exportAccounts(
    companyId: string,
    format: ExportFormat
  ): Promise<ServiceResult> {
    try {
      await this.checkPermissions(companyId);

      const accounts = await getAccountPlanByCompany(companyId);
      const company = await getCompanyById(companyId);

      let exportData;

      switch (format) {
        case "excel":
          exportData = await this.exportToExcel(accounts, company);
          break;
        case "pdf":
          exportData = await this.exportToPDF(accounts, company);
          break;
        case "csv":
          exportData = await this.exportToCSV(accounts, company);
          break;
        default:
          throw new Error("Formato não suportado");
      }

      return {
        success: true,
        data: exportData,
        message: `Plano de contas exportado em ${format.toUpperCase()}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro na exportação",
      };
    }
  }

  private async checkPermissions(companyId: string): Promise<void> {
    // Mesma lógica de permissão dos outros serviços
    const company = await getCompanyById(companyId);
    if (!company) throw new Error("Empresa não encontrada");

    const hasPermission =
      this.user.role === "admin" ||
      (this.user.role === "contador" &&
        company.accountingFirmId === this.user.accountingFirmId) ||
      (this.user.role === "empresa" && company.userId === this.user.id);

    if (!hasPermission) throw new Error("Acesso negado");
  }

  private async exportToExcel(accounts: any[], company: any): Promise<Buffer> {
    // Implementar com ExcelJS
    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Plano de Contas");

    worksheet.columns = [
      { header: "Nome", key: "name", width: 30 },
      { header: "Tipo", key: "type", width: 15 },
      { header: "Grupo DRE", key: "dreGroup", width: 25 },
    ];

    accounts.forEach((account) => {
      worksheet.addRow({
        name: account.name,
        type: account.type === "receita" ? "Receita" : "Despesa",
        dreGroup: account.dreGroup?.name || "",
      });
    });

    return await workbook.xlsx.writeBuffer();
  }

  private async exportToPDF(accounts: any[], company: any): Promise<Buffer> {
    // Implementar com PDFKit ou similar
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();

    doc.fontSize(16).text(`Plano de Contas - ${company.name}`, 50, 50);

    let y = 100;
    accounts.forEach((account) => {
      doc.fontSize(12).text(`${account.name} (${account.type})`, 50, y);
      y += 20;
    });

    doc.end();
    return doc; // Converter para buffer conforme necessário
  }

  private async exportToCSV(accounts: any[], company: any): Promise<string> {
    const headers = ["Nome", "Tipo", "Grupo DRE"];
    const rows = accounts.map((account) => [
      account.name,
      account.type === "receita" ? "Receita" : "Despesa",
      account.dreGroup?.name || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    return csvContent;
  }
}
