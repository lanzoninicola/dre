import { Company } from "@prisma/client";
import { Building2, ChevronDown, Search, X } from "lucide-react";
import { useState, useMemo } from "react";

interface CompanyDropdownFilterWithSearchProps {
  companies: Company[];
  selectedCompany: Company | null;
  onCompanyChange: (company: Company | null) => void;
}

// Company Filter Dropdown Component
export default function CompanyDropdownFilterWithSearch({
  companies = [],
  selectedCompany,
  onCompanyChange,
}: CompanyDropdownFilterWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.cnpj && company.cnpj.includes(searchTerm))
    );
  }, [companies, searchTerm]);

  const handleSelect = (company) => {
    onCompanyChange(company);
    setIsOpen(false);
    setSearchTerm("");
  };

  const clearSelection = () => {
    onCompanyChange(null);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full min-w-[280px] bg-white border border-gray-300 rounded-md px-3 py-2 text-left focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">
                {selectedCompany ? selectedCompany.name : "Todas as empresas"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedCompany && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
                  }`}
              />
            </div>
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {/* "Todas as empresas" option */}
              <button
                onClick={() => handleSelect(null)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">Todas as empresas</span>
              </button>

              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSelect(company)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-gray-900 font-medium truncate">
                          {company.name}
                        </div>
                        {company.cnpj && (
                          <div className="text-gray-500 text-xs">
                            {company.cnpj}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  Nenhuma empresa encontrada
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
