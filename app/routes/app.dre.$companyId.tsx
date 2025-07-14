// app/routes/empresas.$companyId.dres.tsx

import { defer, json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useNavigation, useActionData, Outlet } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";
import { generateDRE, listDREs } from "~/services/dre.server";
import { DREList } from "~/components/dre/DREList";
import { useState } from "react";
import { Calendar, Plus, FileText, Download, TrendingUp, AlertCircle } from "lucide-react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const { companyId } = params;

  if (!companyId) {
    throw new Response("Company ID required", { status: 400 });
  }

  // Load company info
  const companyPromise = prisma.companies.findUnique({
    where: { id: companyId }
  });

  // Load DREs for this company
  const dresPromise = listDREs(prisma, {
    companyId,
    limit: 20
  });

  return defer({
    user,
    companyId,
    company: await companyPromise,
    dresData: dresPromise
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const { companyId } = params;

  if (!companyId) {
    return json({ success: false, error: "Company ID required" }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "generate") {
    const periodStart = formData.get("periodStart") as string;
    const periodEnd = formData.get("periodEnd") as string;

    if (!periodStart || !periodEnd) {
      return json({
        success: false,
        error: "Período de início e fim são obrigatórios"
      });
    }

    const result = await generateDRE(prisma, {
      companyId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      userId: user.id
    });

    return json(result);
  }

  return json({ success: false, error: "Ação inválida" });
}

export default function DREsPage() {
  const { user, companyId, company, dresData } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  const isGenerating = navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "generate";

  if (!company) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">Empresa não encontrada</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            DREs - {company.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Demonstrações do Resultado do Exercício
          </p>
        </div>

        <button
          onClick={() => setShowGenerateForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Gerar Nova DRE
        </button>
      </div>

      {/* Action Result */}
      {actionData && (
        <div className={`mb-6 p-4 rounded-lg border ${actionData.success
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-red-50 border-red-200 text-red-700'
          }`}>
          <div className="flex items-center gap-2">
            {actionData.success ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p>
              {actionData.success
                ? 'DRE gerada com sucesso!'
                : actionData.error
              }
            </p>
          </div>
        </div>
      )}

      {/* Generate Form Modal */}
      {showGenerateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Gerar Nova DRE</h3>

            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="generate" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  name="periodStart"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Fim
                </label>
                <input
                  type="date"
                  name="periodEnd"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGenerateForm(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {isGenerating ? "Gerando..." : "Gerar DRE"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* DREs List */}
      <DREList dresDataPromise={dresData} companyId={companyId} />

      <Outlet />
    </div>
  );
}