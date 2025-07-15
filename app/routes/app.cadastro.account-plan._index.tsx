// app/routes/empresas.$companyId.plano-contas.tsx
import { useState, Suspense } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { defer } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Search, Building2 } from "lucide-react";
import { requireUser } from "~/domain/auth/auth.server";
import prismaClient from "~/lib/prisma/client.server";
import type { Company } from "@prisma/client";

interface LoaderData {
  companies: Company[];
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
      cnpj: true
    },
    orderBy: { name: 'asc' }
  });

  return defer<LoaderData>({ companies });
}

export default function AccountPlanIndex() {
  const { companies } = useLoaderData<LoaderData>();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCompanies = searchTerm
    ? companies.filter(
      (company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.cnpj && company.cnpj.includes(searchTerm))
    )
    : companies;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar empresa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="space-y-1">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((company) => (
            <Link
              key={company.id}
              to={`/app/cadastro/account-plan/${company.id}`}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm block"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-gray-900 font-medium truncate">
                    {company.name}
                  </div>
                  {company.cnpj && (
                    <div className="text-gray-500 text-xs">{company.cnpj}</div>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-sm text-gray-500">Nenhuma empresa encontrada.</div>
        )}
      </div>
    </div>
  );
}
