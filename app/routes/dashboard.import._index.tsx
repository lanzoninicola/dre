// app/routes/dashboard.import._index.tsx
import { useLoaderData, useFetcher } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, unstable_parseMultipartFormData, unstable_createMemoryUploadHandler } from "@remix-run/node";
import { useState, useRef, useEffect } from "react";
import { requireUser } from "~/domain/auth/auth.server";
import prismaClient from "~/lib/prisma/client.server";
import { OFXPreview } from "~/domain/ofx/components/ofx-preview";
import { PageLayout } from "~/components/layouts/page-layout";
import { AlertTriangle, Building2, CheckCircle, Upload, TrendingUp, FileText, Database } from "lucide-react";
import { validateOFXFile } from "~/domain/ofx/ofx.client";
import { parseOFX, generateFileHash, detectDuplicateTransactions, generateImportReport } from "~/domain/ofx/ofx-parser.server";
import crypto from "crypto";
import AlertMessage from "~/components/alert-message/alert-message";

// ====================================
// LOADER (mantido igual)
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
// ACTION (mantida igual)
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

    if (file.size === 0) {
      return json({
        success: false,
        error: "Arquivo vazio. Por favor, selecione um arquivo válido."
      }, { status: 400 });
    }

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

    if (!company) {
      throw new Error("Empresa não encontrada ou acesso negado");
    }

    const userCompanyGrants = await prismaClient.userCompanyAccess.findFirst({
      where: {
        userId: user.id
      }
    });

    if (!userCompanyGrants) {
      throw new Error("Acesso negado");
    }

    const fileContent = await file.text();
    const fileHash = generateFileHash(fileContent);

    if (intent === "confirm") {
      const existingImport = await prismaClient.importLog.findFirst({
        where: { hash: fileHash, companyId }
      });

      if (existingImport) {
        return json({
          success: false,
          error: "Este arquivo já foi importado anteriormente"
        }, { status: 409 });
      }
    }

    const parseResult = parseOFX(fileContent);

    if (!parseResult.success) {
      return json({
        success: false,
        error: parseResult.error
      }, { status: 400 });
    }

    const { data: ofxData } = parseResult;
    const uniqueTransactions = detectDuplicateTransactions(ofxData.transactions);
    const report = generateImportReport(uniqueTransactions);

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
          fileContent,
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

    if (intent === "confirm") {
      const selectedTransactionIds = JSON.parse(formData.get("selectedTransactionIds") as string || "[]");

      return await prismaClient.$transaction(async (tx) => {
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

        const bankStatement = await tx.bankStatement.create({
          data: {
            id: crypto.randomUUID(),
            companyId,
            importedAt: new Date(),
            hash: fileHash,
            fileName: file.name,
          }
        });

        const selectedTransactions = uniqueTransactions.filter(t =>
          selectedTransactionIds.length === 0 || selectedTransactionIds.includes(t.id)
        );

        const bankTransactions = await Promise.all(
          selectedTransactions.map(transaction => {
            const transactionHash = crypto
              .createHash('md5')
              .update(`${transaction.id}-${transaction.date.toISOString()}-${transaction.amount}-${transaction.description}`)
              .digest('hex');

            return tx.bankTransaction.create({
              data: {
                id: crypto.randomUUID(),
                statementId: bankStatement.id,
                importLogId: importLog.id,
                date: transaction.date,
                description: transaction.description,
                amount: transaction.amount,
                transactionHash,
                transactionType: transaction.type,
                createdAt: new Date(),
                isClassified: false,
                isReconciled: false,
                documentNumber: transaction.checkNumber || null,
                notes: transaction.memo || null,
              }
            });
          })
        );

        await tx.importLog.update({
          where: { id: importLog.id },
          data: { transactionsCount: bankTransactions.length }
        });

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
// COMPONENTES ATUALIZADOS
// ====================================

function StatsCards({ stats, companiesCount }: { stats: any, companiesCount: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="card-stat">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-small">Total de Importações</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalImports}</p>
          </div>
        </div>
      </div>

      <div className="card-stat">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Database className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-small">Total de Transações</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalTransactions}</p>
          </div>
        </div>
      </div>

      <div className="card-stat">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-small">Empresas Cadastradas</p>
            <p className="text-2xl font-semibold text-gray-900">{companiesCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanySelect({
  companies,
  selectedCompany,
  onCompanyChange,
  disabled = false
}: {
  companies: any[],
  selectedCompany: string,
  onCompanyChange: (value: string) => void,
  disabled?: boolean
}) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Empresa
      </label>
      <div className="relative">
        <select
          value={selectedCompany}
          onChange={(e) => onCompanyChange(e.target.value)}
          disabled={disabled}
          className="input-default w-full appearance-none pr-10"
          required
        >
          <option value="">Selecione uma empresa...</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Building2 className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

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
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${dragActive
          ? 'border-indigo-400 bg-indigo-50'
          : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={(e) => onDragEvents(e, 'dragenter')}
        onDragLeave={(e) => onDragEvents(e, 'dragleave')}
        onDragOver={(e) => onDragEvents(e, 'dragover')}
        onDrop={onDrop}
      >
        <div className="space-y-1 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 px-2 py-1"
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

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-sm text-gray-600">{message}</span>
    </div>
  );
}

function ImportHistorySidebar({ recentImports }: { recentImports: any[] }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="card-sidebar">
        <div className="flex items-center mb-4">
          <FileText className="h-5 w-5 text-gray-700 mr-2" />
          <h3 className="text-heading-3">Importações Recentes</h3>
        </div>

        {recentImports.length === 0 ? (
          <p className="text-small text-center py-8">
            Nenhuma importação realizada ainda
          </p>
        ) : (
          <div className="space-y-3">
            {recentImports.map((importLog) => (
              <div
                key={importLog.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    Concluído
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dicas */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-500" />
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
  const [previewData, setPreviewData] = useState<any>(null);
  const [step, setStep] = useState<'idle' | 'parsing' | 'preview' | 'importing' | 'success'>('idle');
  const [currentFile, setCurrentFile] = useState<File | null>(null);

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

    setCurrentFile(file);
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
    if (!previewData || !currentFile) return;

    setStep('importing');

    const formData = new FormData();
    formData.append("file", currentFile);
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
    setCurrentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
          <div className="card-default p-8">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-600 text-white">
                  <Upload className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-heading-3">
                  Importar Extrato OFX
                </h3>
                <p className="text-muted mt-1">
                  Selecione uma empresa e faça upload do arquivo OFX para importar transações
                </p>
              </div>
            </div>

            {/* Mensagens de estado */}
            {fetcher.data?.error && (
              <div className="mb-6">
                <AlertMessage type="error" message={fetcher.data.error} />
              </div>
            )}

            {step === 'success' && (
              <div className="mb-6">
                <AlertMessage
                  type="success"
                  message={fetcher.data?.data?.message || 'Importação realizada com sucesso!'}
                />
              </div>
            )}

            {validationError && (
              <div className="mb-6">
                <AlertMessage type="warning" message={validationError} />
              </div>
            )}

            {/* Seleção de empresa */}
            <CompanySelect
              companies={companies}
              selectedCompany={selectedCompany}
              onCompanyChange={setSelectedCompany}
              disabled={fetcher.state === 'submitting'}
            />

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

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ImportHistorySidebar recentImports={recentImports} />
        </div>
      </div>
    </PageLayout>
  );
}