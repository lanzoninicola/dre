import { Form, Link } from "@remix-run/react";
import { ArrowRightLeft, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

// Componente para linha da conta
export default function AccountRow({ account, companyId, dreGroups }) {
  const canDelete = account._count.bankTransactions === 0;

  return (
    <>
      <div className="p-6 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="font-medium text-gray-900">{account.name}</h4>
            {account._count.bankTransactions > 0 && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                {account._count.bankTransactions} transações
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{account.dreGroup.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/app/cadastro/account-plan/${companyId}/${account.type}/move?accountId=${account.id}`}
            className="btn-ghost p-2"
            title="Mover para outro grupo"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </Link>

          <Link
            to={`/app/cadastro/account-plan/${companyId}/${account.type}/edit/${account.id}`}
            className="btn-ghost p-2"
            title="Editar conta"
          >
            <Edit className="w-4 h-4" />
          </Link>

          {canDelete && (
            <Form method="post" className="inline">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="accountId" value={account.id} />
              <button
                type="submit"
                className="btn-ghost p-2 text-red-600 hover:text-red-700"
                title="Excluir conta"
                onClick={(e) => {
                  if (!confirm('Tem certeza que deseja excluir esta conta?')) {
                    e.preventDefault();
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Form>
          )}
        </div>
      </div>


    </>
  );
}
