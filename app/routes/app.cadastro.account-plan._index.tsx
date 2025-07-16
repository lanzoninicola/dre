// app/routes/empresas.$companyId.plano-contas.tsx
import { useState, Suspense } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { defer } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  Search,
  Building2,
  FolderTree,
  ArrowRight,
  Filter,
  Grid3X3,
  List,
  ChevronRight, Calendar,
  Users
} from "lucide-react";
import { requireUser } from "~/domain/auth/auth.server";
import prismaClient from "~/lib/prisma/client.server";
import { CompanyWithStats } from "~/domain/company/company.server";



interface LoaderData {
  companies: CompanyWithStats[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const companies = await prismaClient.company.findMany({
    where: {
      OR: [
        { users: { some: { id: user.id } } },
        { accountingFirmId: user.accountingFirmId }
      ]
    },
    select: {
      id: true,
      name: true,
      cnpj: true,
      createdAt: true,
      _count: {
        select: {
          accounts: true,
          users: true

        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return defer<LoaderData>({ companies });
}

// Componente de Card da Empresa
function CompanyCard({ company }: { company: CompanyWithStats }) {
  return (
    <Link
      to={`/app/cadastro/account-plan/${company.id}`}
      className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
              {company.name}
            </h3>
            <p className="text-sm text-gray-500">CNPJ: {company.cnpj}</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{company._count.accounts}</div>
          <div className="text-xs text-gray-500">Contas</div>
        </div>
        {/* <div className="text-center border-l border-r border-gray-200">
          <div className="text-lg font-semibold text-gray-900">{company._count.bankTransactions}</div>
          <div className="text-xs text-gray-500">Transações</div>
        </div> */}
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{company._count.users}</div>
          <div className="text-xs text-gray-500">Usuários</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>Desde {new Date(company.createdAt).getFullYear()}</span>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
          <FolderTree className="w-4 h-4" />
          <span>Plano de Contas</span>
        </div>
      </div>
    </Link>
  );
}

// Componente de Item da Lista
function CompanyListItem({ company }: { company: CompanyWithStats }) {
  return (
    <Link
      to={`/app/cadastro/account-plan/${company.id}`}
      className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
              {company.name}
            </h3>
            <p className="text-sm text-gray-500">CNPJ: {company.cnpj}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <FolderTree className="w-4 h-4" />
              <span>{company._count.accounts}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{company._count.users}</span>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// Componente de Loading
function CompaniesLoading({ viewMode }: { viewMode: 'grid' | 'list' }) {
  const items = Array.from({ length: 6 }, (_, i) => i);

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="text-center">
                  <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AccountPlanIndex() {
  const { companies } = useLoaderData<LoaderData>();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const filteredCompanies = searchTerm
    ? companies.filter(
      (company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.cnpj && company.cnpj.includes(searchTerm))
    )
    : companies;

  return (
    <div className="min-h-screen">

      {/* Content */}

      <div className="max-w-7xl mx-auto px-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total de Empresas</p>
                <p className="text-2xl font-semibold text-gray-900">{companies.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Contas Cadastradas</p>
                <p className="text-2xl font-semibold text-green-600">
                  {companies.reduce((sum, company) => sum + company._count.accounts, 0)}
                </p>
              </div>
              <FolderTree className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Transações Totais</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {companies.reduce((sum, company) => sum + company._count.bankTransactions, 0)}
                </p>
              </div>
              <Filter className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar empresa por nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Grade</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Lista</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {filteredCompanies.length > 0
                ? `Encontradas ${filteredCompanies.length} empresa${filteredCompanies.length !== 1 ? 's' : ''} para "${searchTerm}"`
                : `Nenhuma empresa encontrada para "${searchTerm}"`
              }
            </p>
          </div>
        )}

        {/* Companies List */}
        <Suspense fallback={<CompaniesLoading viewMode={viewMode} />}>
          {filteredCompanies.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                {filteredCompanies.map((company) => (
                  <CompanyListItem key={company.id} company={company} />
                ))}
              </div>
            )
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa disponível'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                {searchTerm
                  ? 'Tente ajustar o termo de busca ou verificar a ortografia.'
                  : 'Você não possui acesso a nenhuma empresa ou nenhuma empresa foi cadastrada ainda.'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Limpar busca
                </button>
              )}
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}