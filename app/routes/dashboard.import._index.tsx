// app/routes/dashboard.import._index.tsx
import { useLoaderData, useFetcher } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, unstable_parseMultipartFormData, unstable_createMemoryUploadHandler } from "@remix-run/node";
import { useState, useRef, useEffect } from "react";
import { requireUser } from "~/domain/auth/auth.server";
import prismaClient from "~/lib/prisma/client.server";
import { OFXPreview } from "~/domain/ofx/components/ofx-preview";
import { PageLayout } from "~/components/layouts/page-layout";
import { AlertTriangle, Building2, CheckCircle, Upload } from "lucide-react";
import { GlassSelect } from "~/components/layouts/glass-select";
import { validateOFXFile } from "~/domain/ofx/ofx.client";
import { parseOFX, generateFileHash, detectDuplicateTransactions, generateImportReport } from "~/domain/ofx/ofx.server";
import crypto from "crypto";
import AlertMessage from "~/components/alert-message/alert-message";

// ====================================
// LOADER
// ====================================
export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);

  const companies = await prismaClient.company.findMany({
    where: {
      accountingFirmId: user?.accountingFirmId
    },
    orderBy: { name: "asc" },
  });

  const recentImports = await prismaClient.importLog.findMany({
    where: {
      OR: [
        { userId: user.id },
        { companyId: user.company?.id }
      ]

    },
    include: {
      company: true,
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { importedAt: "desc" },
    take: 10,
  });

  const importCount = await prismaClient.importLog.count({
    where: {
      OR: [
        { userId: user.id },
        { companyId: user.company?.id }
      ]
    },
  });

  const transactionCount = await prismaClient.bankTransaction.count({
    where: {
      importLog: {
        OR: [
          { userId: user.id },
          { companyId: user.company?.id }
        ]
      }
    }
  });

  return json({
    companies,
    recentImports,
    stats: {
      totalImports: importCount || 0,
      totalTransactions: transactionCount || 0,
    }
  });
};

// ====================================
// ACTION
// ====================================
export const action: ActionFunction = async ({ request }) => {
  const user = await requireUser(request);

  try {
    const uploadHandler = unstable_createMemoryUploadHandler({
      maxPartSize: 10_000_000, // 10MB
    });

    const formData = await unstable_parseMultipartFormData(request, uploadHandler);
    const file = formData.get("file") as File;
    const companyId = formData.get("companyId") as string;
    const intent = formData.get("intent") as string;

    if (!file || !companyId) {
      return json({
        success: false,
        error: "Arquivo e empresa são obrigatórios"
      }, { status: 400 });
    }

    // Verificar se a empresa pertence ao usuário/firma
    const company = await prismaClient.company.findFirst({
      where: {
        id: companyId,
        accountingFirmId: user.accountingFirmId,
        accountingFirm: {
          users: {
            some: {
              id: user.id
            }
          }
        }
      }
    });
    // Validação adicional baseada no tipo de usuário
    if (!company) {
      throw new Error("Empresa não encontrada ou acesso negado");
    }

    const userCompanyGrants = prismaClient.userCompanyAccess.findFirst({
      where: {
        userId: user.id
      }
    })

    if (!userCompanyGrants) {
      throw new Error("Acesso negado");
    }

    // FUTURE FEATURE check the permission UserCompanyAccess.permissions

    const fileContent = await file.text();
    const fileHash = generateFileHash(fileContent);

    // Verificar duplicidade
    const existingImport = await prismaClient.importLog.findFirst({
      where: { hash: fileHash, companyId }
    });

    if (existingImport) {
      return json({
        success: false,
        error: "Este arquivo já foi importado anteriormente"
      }, { status: 409 });
    }

    // Parse do arquivo OFX
    const parseResult = parseOFX(fileContent);

    if (!parseResult.success) {
      return json({
        success: false,
        error: parseResult.error
      }, { status: 400 });
    }

    const { data: ofxData } = parseResult;

    // Remover duplicatas
    const uniqueTransactions = detectDuplicateTransactions(ofxData.transactions);
    const report = generateImportReport(uniqueTransactions);

    // Se for apenas preview, retornar dados
    if (intent === "preview") {
      return json({
        success: true,
        data: {
          transactions: uniqueTransactions.map(t => ({
            id: t.id,
            date: t.date.toISOString(),
            description: t.description,
            amount: t.amount,
            type: t.type,
            memo: t.memo,
            checkNumber: t.checkNumber,
            referenceNumber: t.referenceNumber
          })),
          report,
          fileHash,
          accountInfo: {
            accountId: ofxData.accountId,
            bankId: ofxData.bankId,
            accountType: ofxData.accountType,
            routingNumber: ofxData.routingNumber,
            balanceAmount: ofxData.balanceAmount,
            balanceDate: ofxData.balanceDate?.toISOString()
          }
        }
      });
    }

    // Se for confirmação, salvar no banco
    if (intent === "confirm") {
      const selectedTransactionIds = JSON.parse(formData.get("selectedTransactionIds") as string || "[]");

      return await prismaClient.$transaction(async (tx) => {
        // Criar log de importação
        const importLog = await tx.importLog.create({
          data: {
            id: crypto.randomUUID(),
            companyId,
            userId: user.id,
            fileName: file.name,
            hash: fileHash,
            importedAt: new Date(),
          }
        });

        // Criar extrato bancário
        const bankStatement = await tx.bankStatement.create({
          data: {
            id: crypto.randomUUID(),
            companyId,
            importedAt: new Date(),
            hash: fileHash,
            fileName: file.name,
          }
        });

        // Filtrar transações selecionadas
        const selectedTransactions = uniqueTransactions.filter(t =>
          selectedTransactionIds.length === 0 || selectedTransactionIds.includes(t.id)
        );

        // Criar transações bancárias
        const bankTransactions = await Promise.all(
          selectedTransactions.map(transaction =>
            tx.bankTransaction.create({
              data: {
                id: crypto.randomUUID(),
                statementId: bankStatement.id,
                importLogId: importLog.id,
                date: transaction.date,
                description: transaction.description,
                amount: transaction.amount,
                createdAt: new Date(),
                // Campos opcionais do OFX
                memo: transaction.memo,
                checkNumber: transaction.checkNumber,
                referenceNumber: transaction.referenceNumber,
                transactionType: transaction.type,
              }
            })
          )
        );

        // Atualizar contagem no import log
        await tx.importLog.update({
          where: { id: importLog.id },
          data: { transactionCount: bankTransactions.length }
        });

        // Registrar auditoria
        await tx.auditLog.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            action: "IMPORT",
            entity: "BankStatement",
            entityId: bankStatement.id,
            details: JSON.stringify({
              fileName: file.name,
              transactionsCount: bankTransactions.length,
              companyId,
              importLogId: importLog.id
            }),
            createdAt: new Date(),
          }
        });

        return json({
          success: true,
          data: {
            importLogId: importLog.id,
            transactionsImported: bankTransactions.length,
            message: `${bankTransactions.length} transações importadas com sucesso!`
          }
        });
      });
    }

    return json({
      success: false,
      error: "Intent inválido"
    }, { status: 400 });

  } catch (error) {
    console.error("Erro na importação:", error);
    return json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 });
  }
};

// ====================================
// COMPONENTES
// ====================================

// Componente para cards de estatísticas
function StatsCards({ stats, companiesCount }: { stats: any, companiesCount: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/70 transition-all duration-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total de Importações</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalImports}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/70 transition-all duration-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total de Transações</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/70 transition-all duration-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Empresas Cadastradas</p>
            <p className="text-2xl font-bold text-gray-900">{companiesCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}



// Componente para área de upload
function FileUploadArea({
  dragActive,
  onDragEvents,
  onDrop,
  onFileChange,
  disabled = false,
  fileInputRef
}: {
  dragActive: boolean;
  onDragEvents: (e: React.DragEvent, type: string) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Arquivo OFX
      </label>
      <div
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-all duration-200 bg-white/30 backdrop-blur-sm ${dragActive
          ? 'border-indigo-400 bg-indigo-50/50'
          : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        onDragEnter={(e) => onDragEvents(e, 'dragenter')}
        onDragLeave={(e) => onDragEvents(e, 'dragleave')}
        onDragOver={(e) => onDragEvents(e, 'dragover')}
        onDrop={onDrop}
      >
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white/60 backdrop-blur-sm rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 px-2 py-1"
            >
              <span>Clique para selecionar um arquivo</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".ofx"
                className="sr-only"
                ref={fileInputRef}
                onChange={onFileChange}
                disabled={disabled}
              />
            </label>
            <p className="pl-1">ou arraste e solte aqui</p>
          </div>
          <p className="text-xs text-gray-500">
            Apenas arquivos OFX (máximo 10MB)
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente para loading
function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-sm text-gray-600">{message}</span>
    </div>
  );
}

// Componente para sidebar de histórico
function ImportHistorySidebar({ recentImports }: { recentImports: any[] }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div>
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Importações Recentes
          </h3>
        </div>
        <div className="px-6 py-4">
          {recentImports.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Nenhuma importação realizada ainda
            </p>
          ) : (
            <div className="space-y-4">
              {recentImports.map((importLog) => (
                <div
                  key={importLog.id}
                  className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/70 transition-all duration-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {importLog.company.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(importLog.importedAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {importLog._count.transactions} transações
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100/80 text-green-800 backdrop-blur-sm">
                      Concluído
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dicas */}
      <div className="mt-6 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Dicas para importação
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Certifique-se de que o arquivo OFX está no formato correto</li>
                <li>Verifique se a empresa está selecionada antes do upload</li>
                <li>Transações duplicadas serão automaticamente detectadas</li>
                <li>Você pode revisar as transações antes de confirmar a importação</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================
// COMPONENTE PRINCIPAL
// ====================================
export default function ImportOFXEnhanced() {
  const { companies, recentImports, stats } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [step, setStep] = useState<'idle' | 'parsing' | 'preview' | 'importing' | 'success'>('idle');

  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name
  }));

  const validateFile = (file: File) => {
    const validation = validateOFXFile(file);
    if (validation.error) {
      setValidationError(validation.error);
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleDragEvents = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();

    switch (type) {
      case 'dragenter':
      case 'dragover':
        setDragActive(true);
        break;
      case 'dragleave':
        setDragActive(false);
        break;
      case 'drop':
        setDragActive(false);
        break;
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    if (!selectedCompany) {
      alert("Por favor, selecione uma empresa antes de escolher o arquivo.");
      return;
    }

    setStep('parsing');

    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyId", selectedCompany);
    formData.append("intent", "preview");

    fetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data"
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    handleDragEvents(e, 'drop');
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImportConfirm = (selectedTransactionIds: string[]) => {
    if (!previewData) return;

    setStep('importing');

    const formData = new FormData();
    formData.append("file", fileInputRef.current?.files?.[0] || new Blob());
    formData.append("companyId", selectedCompany);
    formData.append("intent", "confirm");
    formData.append("selectedTransactionIds", JSON.stringify(selectedTransactionIds));

    fetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data"
    });
  };

  const resetImportState = () => {
    setStep('idle');
    setPreviewData(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Atualizar estado baseado na resposta do fetcher
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        if (fetcher.data.data?.transactions) {
          setPreviewData(fetcher.data.data);
          setStep('preview');
        } else if (fetcher.data.data?.transactionsImported) {
          setStep('success');
          setTimeout(() => {
            resetImportState();
            window.location.reload();
          }, 3000);
        }
      } else {
        setValidationError(fetcher.data.error || 'Erro desconhecido');
        setStep('idle');
      }
    }
  }, [fetcher.data]);

  // Renderizar preview se estivermos na etapa de preview
  if (step === 'preview' && previewData) {
    return (
      <OFXPreview
        transactions={previewData.transactions}
        report={previewData.report}
        onConfirm={handleImportConfirm}
        onCancel={resetImportState}
        loading={step === 'importing'}
      />
    );
  }

  return (
    <PageLayout
      title="Importar Extrato OFX"
      subtitle="Importação de extrato bancário"
    >
      <StatsCards stats={stats} companiesCount={companies.length} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de importação */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="px-8 py-8">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                    <Upload className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Importar Extrato OFX
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Selecione uma empresa e faça upload do arquivo OFX para importar transações
                  </p>
                </div>
              </div>

              {/* Mensagens de estado */}
              {fetcher.data?.error && (
                <AlertMessage type="error" message={fetcher.data.error} />
              )}

              {step === 'success' && (
                <AlertMessage
                  type="success"
                  message={fetcher.data?.data?.message || 'Importação realizada com sucesso!'}
                />
              )}

              {validationError && (
                <AlertMessage type="warning" message={validationError} />
              )}

              {/* Seleção de empresa */}
              <div className="mb-6">
                <GlassSelect
                  label="Empresa"
                  value={selectedCompany}
                  onChange={setSelectedCompany}
                  options={companyOptions}
                  placeholder="Selecione uma empresa..."
                  icon={<Building2 className="w-5 h-5" />}
                  required
                  disabled={fetcher.state === 'submitting'}
                />
              </div>

              {/* Área de upload */}
              <FileUploadArea
                dragActive={dragActive}
                onDragEvents={handleDragEvents}
                onDrop={handleDrop}
                onFileChange={handleFileInputChange}
                disabled={fetcher.state === 'submitting'}
                fileInputRef={fileInputRef}
              />

              {/* Loading state */}
              {(step === 'parsing' || fetcher.state === 'submitting') && (
                <LoadingState
                  message={step === 'parsing' ? 'Processando arquivo...' : 'Importando transações...'}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <ImportHistorySidebar recentImports={recentImports} />
      </div>
    </PageLayout>
  );
}