// app/routes/app.import._index.tsx
import { useLoaderData, useFetcher, Await, useNavigate } from "@remix-run/react";
import type { LoaderFunction, ActionFunction, SerializeFrom } from "@remix-run/node";
import { json, defer, unstable_parseMultipartFormData, unstable_createMemoryUploadHandler } from "@remix-run/node";
import { useState, useRef, useEffect, Suspense } from "react";
import { requireUser } from "~/domain/auth/auth.server";
import prismaClient from "~/lib/prisma/client.server";
import { OFXPreview } from "~/domain/ofx/components/ofx-preview";
import { PageLayout } from "~/components/layouts/page-layout";
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Upload,
  TrendingUp,
  FileText,
  Database,
  Calendar,
  Activity,
  DollarSign,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";
import { validateOFXFile } from "~/domain/ofx/ofx.client";
import { parseOFX, generateFileHash, detectDuplicateTransactions, generateImportReport } from "~/domain/ofx/ofx-parser.server";
import crypto from "crypto";
import AlertMessage from "~/components/alert-message/alert-message";
import formatDate from "~/utils/format-date";

// ====================================
// TIPOS E INTERFACES
// ====================================
interface LoaderData {
  companies: Array<{
    id: string;
    name: string;
    cnpj: string;
  }>;
  stats: {
    totalImports: number;
    totalTransactions: number;
    averagePerMonth: number;
    lastImportDate: string | null;
  };
  recentImports: Promise<Array<{
    id: string;
    fileName: string;
    importedAt: string;
    transactionsCount: number;
    company: {
      id: string;
      name: string;
    };
  }>>;
  monthlyStats: Promise<Array<{
    month: string;
    imports: number;
    transactions: number;
    companies: string[];
  }>>;
}

// ====================================
// LOADER COM DEFER
// ====================================
export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);

  // Dados essenciais carregados imediatamente
  const [companies, basicStats] = await Promise.all([
    prismaClient.company.findMany({
      where: {
        accountingFirmId: user?.accountingFirmId
      },
      select: {
        id: true,
        name: true,
        cnpj: true,
      },
      orderBy: { name: "asc" },
    }),

    prismaClient.importLog.aggregate({
      where: {
        OR: [
          { userId: user.id },
          { companyId: user.company?.id }
        ]
      },
      _count: true,
      _max: { importedAt: true },
    })
  ]);

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

  // Dados não essenciais carregados de forma assíncrona
  const recentImports = prismaClient.importLog.findMany({
    where: {
      OR: [
        { userId: user.id },
        { companyId: user.company?.id }
      ]
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
        }
      },
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { importedAt: "desc" },
    take: 10,
  }).then(imports =>
    imports.map(imp => ({
      id: imp.id,
      fileName: imp.fileName,
      importedAt: imp.importedAt.toISOString(),
      transactionsCount: imp._count.transactions,
      company: imp.company,
    }))
  );

  const monthlyStats = prismaClient.importLog.findMany({
    where: {
      OR: [
        { userId: user.id },
        { companyId: user.company?.id }
      ],
      importedAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
      }
    },
    include: {
      company: {
        select: { name: true }
      },
      _count: {
        select: { transactions: true }
      }
    },
    orderBy: { importedAt: "desc" },
  }).then(imports => {
    const monthlyMap = new Map();

    imports.forEach(imp => {
      const month = imp.importedAt.toISOString().substring(0, 7);
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {
          month,
          imports: 0,
          transactions: 0,
          companies: new Set(),
        });
      }

      const data = monthlyMap.get(month);
      data.imports += 1;
      data.transactions += imp._count.transactions;
      data.companies.add(imp.company.name);
    });

    return Array.from(monthlyMap.values()).map(data => ({
      ...data,
      companies: Array.from(data.companies),
    }));
  });

  const stats = {
    totalImports: basicStats._count || 0,
    totalTransactions: transactionCount || 0,
    averagePerMonth: Math.round((basicStats._count || 0) / 6), // últimos 6 meses
    lastImportDate: basicStats._max.importedAt?.toISOString() || null,
  };

  return defer({
    companies,
    stats,
    recentImports,
    monthlyStats,
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
      }
    });

    if (!company) {
      throw new Error("Empresa não encontrada ou acesso negado");
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
// COMPONENTES DE LOADING
// ====================================
function StatCardSkeleton() {
  return (
    <div className="card-stat animate-pulse">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="ml-4 flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

function RecentImportsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse p-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthlyChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
            <div className="flex-1 h-6 bg-gray-200 rounded"></div>
            <div className="w-12 h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ====================================
// COMPONENTES ATUALIZADOS
// ====================================
function StatsCards({ stats }: { stats: LoaderData['stats'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-small">Média Mensal</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.averagePerMonth}</p>
          </div>
        </div>
      </div>

      <div className="card-stat">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-small">Última Importação</p>
            <p className="text-sm font-semibold text-gray-900">
              {stats.lastImportDate ? formatDate(stats.lastImportDate) : 'Nunca'}
            </p>
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
  companies: LoaderData['companies'],
  selectedCompany: string,
  onCompanyChange: (value: string) => void,
  disabled?: boolean
}) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Empresa *
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
              {company.name} ({company.cnpj})
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
        Arquivo OFX *
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
      <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      <span className="ml-3 text-sm text-gray-600">{message}</span>
    </div>
  );
}

function RecentImportsSection({ recentImportsPromise }: { recentImportsPromise: Promise<any[]> }) {
  return (
    <div className="card-sidebar">
      <div className="flex items-center mb-4">
        <FileText className="h-5 w-5 text-gray-700 mr-2" />
        <h3 className="text-heading-3">Importações Recentes</h3>
      </div>

      <Suspense fallback={<RecentImportsSkeleton />}>
        <Await resolve={recentImportsPromise}>
          {(recentImports) => (
            recentImports.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-small">Nenhuma importação realizada ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentImports.map((importLog: any) => (
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
                        {importLog.transactionsCount} transações
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
            )
          )}
        </Await>
      </Suspense>
    </div>
  );
}

function MonthlyStatsChart({ monthlyStatsPromise }: { monthlyStatsPromise: Promise<any[]> }) {
  return (
    <div className="card-sidebar">
      <div className="flex items-center mb-4">
        <Calendar className="h-5 w-5 text-gray-700 mr-2" />
        <h3 className="text-heading-3">Estatísticas Mensais</h3>
      </div>

      <Suspense fallback={<MonthlyChartSkeleton />}>
        <Await resolve={monthlyStatsPromise}>
          {(monthlyStats) => (
            monthlyStats.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-small">Nenhum dado disponível</p>
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyStats.slice(0, 6).map((stat: any) => (
                  <div key={stat.month} className="border-b border-gray-200 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(stat.month + '-01').toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-xs text-gray-500">
                        {stat.imports} importações
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{stat.transactions} transações</span>
                      <span>{stat.companies.length} empresas</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((stat.transactions / Math.max(...monthlyStats.map(s => s.transactions))) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </Await>
      </Suspense>
    </div>
  );
}

function HelpTipsCard() {
  return (
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
  );
}

// ====================================
// COMPONENTE PRINCIPAL
// ====================================
export default function ImportOFXModernized() {
  const { companies, stats, recentImports, monthlyStats } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
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
      setValidationError("Por favor, selecione uma empresa antes de escolher o arquivo.");
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
    setSelectedCompany('');
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
            // Recarregar a página para atualizar as estatísticas
            navigate('.', { replace: true });
          }, 3000);
        }
      } else {
        setValidationError(fetcher.data.error || 'Erro desconhecido');
        setStep('idle');
      }
    }
  }, [fetcher.data, navigate]);

  // Se estiver na preview, mostrar o componente de preview
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
      subtitle="Sistema de importação bancária com análise em tempo real"
    >
      {/* Stats Cards com carregamento imediato */}
      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de importação - 2 colunas */}
        <div className="lg:col-span-2">
          <div className="card-default p-8">
            {/* Header do formulário */}
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
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Importação concluída!
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>{fetcher.data?.data?.message || 'Importação realizada com sucesso!'}</p>
                        <p className="mt-1">Redirecionando...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {validationError && (
              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Atenção
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>{validationError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Seleção de empresa */}
            <CompanySelect
              companies={companies}
              selectedCompany={selectedCompany}
              onCompanyChange={setSelectedCompany}
              disabled={fetcher.state === 'submitting' || step !== 'idle'}
            />

            {/* Área de upload */}
            <FileUploadArea
              dragActive={dragActive}
              onDragEvents={handleDragEvents}
              onDrop={handleDrop}
              onFileChange={handleFileInputChange}
              disabled={fetcher.state === 'submitting' || step !== 'idle'}
              fileInputRef={fileInputRef}
            />

            {/* Estados de carregamento */}
            {(step === 'parsing' || step === 'importing') && (
              <LoadingState
                message={
                  step === 'parsing'
                    ? 'Analisando arquivo OFX...'
                    : 'Importando transações para o banco de dados...'
                }
              />
            )}

            {/* Botão de reset quando não está em idle */}
            {step !== 'idle' && step !== 'success' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={resetImportState}
                  className="btn-secondary"
                  disabled={fetcher.state === 'submitting'}
                >
                  Nova Importação
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1 coluna */}
        <div className="lg:col-span-1 space-y-6">
          {/* Importações recentes com Suspense */}
          <RecentImportsSection recentImportsPromise={recentImports} />

          {/* Estatísticas mensais com Suspense */}
          <MonthlyStatsChart monthlyStatsPromise={monthlyStats} />

          {/* Dicas de ajuda */}
          <HelpTipsCard />
        </div>
      </div>

      {/* Seção de informações adicionais */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-default p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-gray-700 mr-2" />
            <h3 className="text-heading-3">Formatos Suportados</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Arquivos OFX (Open Financial Exchange)</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Tamanho máximo: 10MB</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Detecção automática de duplicatas</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Validação de integridade</span>
            </div>
          </div>
        </div>

        <div className="card-default p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="h-5 w-5 text-gray-700 mr-2" />
            <h3 className="text-heading-3">Próximos Passos</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                1
              </div>
              <span>Importe seus extratos bancários</span>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                2
              </div>
              <span>Classifique as transações no plano de contas</span>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                3
              </div>
              <span>Gere relatórios DRE automaticamente</span>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                4
              </div>
              <span>Exporte dados para Excel ou PDF</span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}