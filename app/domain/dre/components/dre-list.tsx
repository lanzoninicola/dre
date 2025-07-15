import React, { useState, useMemo } from "react";
import { FileText, Search, ChevronDown, Building2, X } from "lucide-react";
import DRE from "./dre";
import { DREData } from "../dre.types";
import { Company } from "@prisma/client";
import CompanyDropdownFilterWithSearch from "~/domain/company/components/company-fiter";

interface DREsListProps {
  dres: DREData[];
  companies: Company[];
}



export default function DREsList({ dres = [], companies = [] }: DREsListProps) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Filter DREs based on selected company
  const filteredDres = useMemo(() => {
    if (!selectedCompany) return dres;
    return dres.filter(dre => dre.companyId === selectedCompany.id);
  }, [dres, selectedCompany]);

  const dreCount = filteredDres.length;
  const totalDreCount = dres.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              DREs {selectedCompany ? `- ${selectedCompany.name}` : ''}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedCompany
                ? `${dreCount} de ${totalDreCount} DREs`
                : `${totalDreCount} DREs encontradas`
              }
            </p>
          </div>

          <CompanyDropdownFilterWithSearch
            companies={companies}
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
          />
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filteredDres.length > 0 ? (
          filteredDres.map((dre) => (
            <DRE key={dre.id} dre={dre} />
          ))
        ) : (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma DRE encontrada
            </h4>
            <p className="text-gray-500">
              {selectedCompany
                ? `Não há DREs cadastradas para ${selectedCompany.name}.`
                : 'Não há DREs cadastradas no sistema.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}