import { Calendar, Eye, TrendingUp } from "lucide-react";
import formatCurrency from "~/utils/format-currency";
import { DREData } from "../dre.types";
import formatDREPeriod from "../utils/format-dre-period";
import { Link } from "@remix-run/react";

interface DREProps {
  dre: DREData
}

export default function DRE({ dre }: DREProps) {
  const data = dre.data || {};
  const lucroLiquido = data.lucroLiquido || 0;
  const receitaBruta = data.receitaBruta || 0;

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                DRE - {formatDREPeriod(new Date(dre.periodStart), new Date(dre.periodEnd))}
              </h4>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {dre.company && (
                  <span>{dre.company.name}</span>
                )}
                <span>
                  Gerada em {new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }).format(new Date(dre.generatedAt))}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Receita Bruta</p>
                <p className="font-medium text-blue-600">
                  {formatCurrency(receitaBruta)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${lucroLiquido >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                <TrendingUp className={`w-4 h-4 ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Lucro Líquido</p>
                <p className={`font-medium ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {formatCurrency(lucroLiquido)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="ml-6">
          <Link
            to={`/app/dre/${dre.companyId}/${dre.id}`}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Visualizar
          </Link>
        </div>
      </div>
    </div>
  );
}