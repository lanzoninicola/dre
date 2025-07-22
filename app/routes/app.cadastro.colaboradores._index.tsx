import { Download, Plus, Filter } from "lucide-react";
import React from "react";
import { useSubpageSearch, SubpageLayout } from "~/components/layouts/sub-page-layout";
import { Button } from "~/components/ui/button";



export default function AppCadastroColaboradoresIndex() {

  const { showSearch, searchTerm, setSearchTerm, toggleSearch } = useSubpageSearch();
  const [statusFilter, setStatusFilter] = React.useState('all');

  return (
    <SubpageLayout
      backTo="/app/dashboard"
      title="Colaboradores"
      actions={[
        {
          onClick: () => console.log('Exportar'),
          icon: <Download className="w-4 h-4" />,
          children: "Exportar",
          variant: "outline"
        },
        {
          to: "new",
          icon: <Plus className="w-4 h-4" />,
          children: "Nova Colaborador"
        }
      ]}
      searchConfig={{
        searchFilter: {
          placeholder: "Buscar Colaboradores...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value)
        },
        selectFilter: {
          value: statusFilter,
          onChange: (e) => setStatusFilter(e.target.value),
          options: [
            { value: 'all', label: 'Todos os status' },
            { value: 'active', label: 'Ativas' },
            { value: 'inactive', label: 'Inativas' }
          ]
        },
        additionalFilters: (
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
            Mais Filtros
          </Button>
        )
      }}
      showSearch={showSearch}
      onToggleSearch={toggleSearch}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards das Colaboradores aqui */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900">Tech Solutions Ltda</h3>
          <p className="text-sm text-gray-600 mt-1">CNPJ: 12.345.678/0001-90</p>
        </div>
      </div>
    </SubpageLayout>
  );

}