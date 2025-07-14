// app/services/pdf.server.ts

import PDFDocument from "pdfkit";
import { DREData } from "./dre.types";
import formatCurrency from "~/utils/format-currency";

export interface DREPDFData {
  dre: DREData;
  company: {
    id: string;
    name: string;
    cnpj: string;
  };
}

export async function generateDREPDF(data: DREPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header
      addHeader(doc, data.company, data.dre);

      // DRE Content
      addDREContent(doc, data.dre);

      // Footer
      addFooter(doc, data.dre);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function addHeader(
  doc: PDFKit.PDFDocument,
  company: { name: string; cnpj: string },
  dre: DREData
) {
  // Logo/Title
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO", { align: "center" });

  doc.moveDown(0.5);

  // Company info
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(company.name, { align: "center" });

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`CNPJ: ${company.cnpj}`, { align: "center" });

  doc.moveDown(0.5);

  // Period
  const formattedPeriod = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(dre.periodStart);

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(`Período: ${formattedPeriod}`, { align: "center" });

  doc.moveDown(1);
}

function addDREContent(doc: PDFKit.PDFDocument, dre: DREData) {
  const data = dre.data;

  // Helper function to add line
  const addLine = (
    label: string,
    value: number,
    isSubtotal = false,
    level = 0
  ) => {
    const indent = level * 20;
    const font = isSubtotal ? "Helvetica-Bold" : "Helvetica";
    const fontSize = isSubtotal ? 11 : 10;

    doc
      .fontSize(fontSize)
      .font(font)
      .text(label, 50 + indent, doc.y, { width: 350 })
      .text(formatCurrency(value), 400, doc.y - fontSize, {
        width: 150,
        align: "right",
      });

    doc.moveDown(0.3);
  };

  // DRE Structure
  addLine("RECEITA BRUTA", data.receitaBruta, true);

  if (data.deducoesDaReceita) {
    addLine("(-) Deduções da Receita", -data.deducoesDaReceita, false, 1);
  }

  addLine("RECEITA LÍQUIDA", data.receitaLiquida, true);

  if (data.custoDosProdutosVendidos) {
    addLine(
      "(-) Custo dos Produtos Vendidos",
      -data.custoDosProdutosVendidos,
      false,
      1
    );
  }

  if (data.lucroBruto) {
    addLine("LUCRO BRUTO", data.lucroBruto, true);
  }

  // Despesas Operacionais
  doc.moveDown(0.3);
  addLine("DESPESAS OPERACIONAIS:", 0, true);

  if (data.despesasAdministrativas) {
    addLine(
      "Despesas Administrativas",
      -data.despesasAdministrativas,
      false,
      1
    );
  }

  if (data.despesasComerciais) {
    addLine("Despesas Comerciais", -data.despesasComerciais, false, 1);
  }

  if (data.despesasFinanceiras) {
    addLine("Despesas Financeiras", -data.despesasFinanceiras, false, 1);
  }

  if (data.receitasFinanceiras) {
    addLine("(+) Receitas Financeiras", data.receitasFinanceiras, false, 1);
  }

  doc.moveDown(0.5);

  // Draw line before final result
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

  doc.moveDown(0.3);

  addLine("LUCRO LÍQUIDO", data.lucroLiquido, true);
}

function addFooter(doc: PDFKit.PDFDocument, dre: DREData) {
  const pageHeight = doc.page.height;

  doc.y = pageHeight - 100;

  // Line
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

  doc.moveDown(0.5);

  doc
    .fontSize(8)
    .font("Helvetica")
    .text(
      `Relatório gerado em: ${new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date())}`,
      { align: "center" }
    );

  doc.text("FinanceFlow - Sistema de Gestão Contábil", { align: "center" });
}
