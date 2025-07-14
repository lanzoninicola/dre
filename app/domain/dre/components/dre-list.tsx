import { FileText, Link } from "lucide-react";
import DRE from "./dre";
import { DREData } from "../dre.types";

export default function DREsList({ dres = [] }: { dres: DREData[] }) {
  // if (!dresResult.success) {
  //   return (
  //     <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
  //       <div className="text-center py-8">
  //         <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
  //         <p className="text-gray-500">Erro ao carregar DREs</p>
  //         <p className="text-sm text-red-600 mt-2">{dresResult.error}</p>
  //       </div>
  //     </div>
  //   );
  // }



  if (dres.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma DRE encontrada
          </h3>
          <p className="text-gray-500 mb-4">
            As DREs aparecerão aqui quando forem geradas pelas empresas.
          </p>
          <Link
            to="/empresas"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Ver Empresas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Todas as DREs</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {Array.isArray(dres) && dres.map((dre: any) => (
          <DRE key={dre.id} dre={dre} />
        ))}
      </div>
    </div>
  );
}