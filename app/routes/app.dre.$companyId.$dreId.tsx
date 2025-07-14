// app/routes/empresas.$companyId.dres.$dreId.tsx

import { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { ArrowLeft, Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { requireUser } from "~/domain/auth/auth.server";
import { findDREById } from "~/domain/dre/dre.server";
import { generateDREPDF } from "~/domain/dre/generate-dre-pdf.server";
import formatDREPeriod from "~/domain/dre/utils/format-dre-period";
import prismaClient from "~/lib/prisma/client.server";
import formatCurrency from "~/utils/format-currency";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { companyId, dreId } = params;

  if (!companyId || !dreId) {
    throw new Response("Missing parameters", { status: 400 });
  }

  // Load DRE and company
  const [dre, company] = await Promise.all([
    findDREById(dreId),
    prismaClient.company.findUnique({
      where: { id: companyId }
    })
  ]);

  if (!dre) {
    throw new Response("DRE not found", { status: 404 });
  }

  if (!company) {
    throw new Response("Company not found", { status: 404 });
  }

  // Verificar se a DRE pertence à empresa
  if (dre.companyId !== companyId) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return {
    user,
    dre,
    company
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const { dreId } = params;

  if (!dreId) {
    throw new Response("DRE ID required", { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "export-pdf") {
    // Load DRE and company
    const dre = await findDREById(dreId);
    if (!dre) {
      throw new Response("DRE not found", { status: 404 });
    }

    const company = await prismaClient.company.findUnique({
      where: { id: dre.companyId }
    });
    if (!company) {
      throw new Response("Company not found", { status: 404 });
    }

    try {
      const pdfBuffer = await generateDREPDF({
        dre,
        company: {
          id: company.id,
          name: company.name,
          cnpj: company.cnpj ?? ""
        }
      });



      const fileName = `DRE_${company.name.replace(/[^a-zA-Z0-9]/g, '_')}_${formatDREPeriod(dre.periodStart, dre.periodEnd).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`
        }
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Response("Export failed", { status: 500 });
    }
  }

  throw new Response("Invalid action", { status: 400 });
}

export default function DREDetailPage() {
  const { user, dre, company } = useLoaderData<typeof loader>();

  const data = dre.data;

  console.log({ dre, periodStart: dre.periodStart, start: new Date(dre.periodStart), end: new Date(dre.periodEnd) })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            to={`/app/dre`}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              DRE - {formatDREPeriod(new Date(dre.periodStart), new Date(dre.periodEnd))}
            </h1>
            <p className="text-gray-600 mt-1">
              {company.name} • CNPJ: {company.cnpj}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Form method="post">
            <input type="hidden" name="intent" value="export-pdf" />
            <button
              type="submit"
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          </Form>
        </div>
      </div>

      {/* DRE Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Demonstração do Resultado do Exercício
            </h2>
          </div>
          <p className="text-gray-500 mt-1">
            Gerada em: {new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date(dre.generatedAt))}
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {/* Receita Bruta */}
            <DRELine
              label="RECEITA BRUTA"
              value={data.receitaBruta}
              isTitle
            />

            {/* Deduções */}
            {data.deducoesDaReceita > 0 && (
              <DRELine
                label="(-) Deduções da Receita"
                value={-data.deducoesDaReceita}
                isSubItem
              />
            )}

            {/* Receita Líquida */}
            <DRELine
              label="RECEITA LÍQUIDA"
              value={data.receitaLiquida}
              isSubtotal
            />

            {/* Custos */}
            {data.custoDosProdutosVendidos > 0 && (
              <DRELine
                label="(-) Custo dos Produtos Vendidos"
                value={-data.custoDosProdutosVendidos}
                isSubItem
              />
            )}

            {/* Lucro Bruto */}
            {data.lucroBruto !== data.receitaLiquida && (
              <DRELine
                label="LUCRO BRUTO"
                value={data.lucroBruto}
                isSubtotal
              />
            )}

            {/* Despesas Operacionais */}
            <div className="pt-4">
              <DRELine
                label="DESPESAS OPERACIONAIS"
                value={0}
                isTitle
                showValue={false}
              />

              {data.despesasAdministrativas > 0 && (
                <DRELine
                  label="Despesas Administrativas"
                  value={-data.despesasAdministrativas}
                  isSubItem
                />
              )}

              {data.despesasComerciais > 0 && (
                <DRELine
                  label="Despesas Comerciais"
                  value={-data.despesasComerciais}
                  isSubItem
                />
              )}

              {data.despesasFinanceiras > 0 && (
                <DRELine
                  label="Despesas Financeiras"
                  value={-data.despesasFinanceiras}
                  isSubItem
                />
              )}

              {data.receitasFinanceiras > 0 && (
                <DRELine
                  label="(+) Receitas Financeiras"
                  value={data.receitasFinanceiras}
                  isSubItem
                />
              )}
            </div>

            {/* Resultado Final */}
            <div className="pt-4 border-t border-gray-200">
              <DRELine
                label="LUCRO LÍQUIDO"
                value={data.lucroLiquido}
                isTotal
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <SummaryCard
          title="Receita Total"
          value={data.receitaBruta}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <SummaryCard
          title="Despesas Totais"
          value={data.despesasAdministrativas + data.despesasComerciais + data.despesasFinanceiras}
          icon={<TrendingDown className="w-5 h-5" />}
          color="red"
        />
        <SummaryCard
          title="Lucro Líquido"
          value={data.lucroLiquido}
          icon={<TrendingUp className="w-5 h-5" />}
          color={data.lucroLiquido >= 0 ? "green" : "red"}
        />
      </div>
    </div>
  );
}

interface DRELineProps {
  label: string;
  value: number;
  isTitle?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isSubItem?: boolean;
  showValue?: boolean;
}

function DRELine({
  label,
  value,
  isTitle,
  isSubtotal,
  isTotal,
  isSubItem,
  showValue = true
}: DRELineProps) {
  let className = "flex justify-between items-center py-2";
  let textClass = "";
  let valueClass = "";

  if (isTotal) {
    className += " border-t-2 border-gray-300 pt-4";
    textClass = "text-lg font-bold text-gray-900";
    valueClass = value >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold";
  } else if (isTitle) {
    textClass = "font-semibold text-gray-900";
    valueClass = "font-semibold text-gray-900";
  } else if (isSubtotal) {
    textClass = "font-medium text-gray-800";
    valueClass = "font-medium text-gray-800";
  } else if (isSubItem) {
    textClass = "text-gray-700 ml-6";
    valueClass = value >= 0 ? "text-green-600" : "text-red-600";
  } else {
    textClass = "text-gray-700";
    valueClass = "text-gray-700";
  }



  return (
    <div className={className}>
      <span className={textClass}>{label}</span>
      {showValue && (
        <span className={valueClass}>{formatCurrency(value)}</span>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red';
}

function SummaryCard({ title, value, icon, color }: SummaryCardProps) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50"
  };



  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(value)}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

