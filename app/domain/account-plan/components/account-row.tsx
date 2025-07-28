import { Form, Link } from "@remix-run/react";
import { ArrowRightLeft, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccountRowProps {
  account: any;
  companyId: string;
  dreGroups: any[];
}

export default function AccountRow({ account, companyId }: AccountRowProps) {
  const canDelete = account._count.bankTransactions === 0;

  return (
    <div className="flex items-center justify-between px-3 py-3 hover:bg-gray-50 transition-colors">
      {/* Info da conta */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <p className="font-medium text-gray-900">{account.name}</p>
          {account._count.bankTransactions > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {account._count.bankTransactions} transações
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          Grupo: {account.dreGroup.name}
        </p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2">
        {/* Mover */}
        <Button
          asChild
          variant="ghost"
          size="icon"
          title="Mover para outro grupo"
        >
          <Link
            to={`/app/cadastro/account-plan/${companyId}/${account.type}/move?accountId=${account.id}`}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </Link>
        </Button>

        {/* Editar */}
        <Button asChild variant="ghost" size="icon" title="Editar conta">
          <Link
            to={`/app/cadastro/account-plan/${companyId}/${account.type}/edit/${account.id}`}
          >
            <Edit className="w-4 h-4" />
          </Link>
        </Button>

        {/* Excluir */}
        {canDelete && (
          <Form method="post" className="inline">
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="accountId" value={account.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="text-red-600 hover:text-red-700"
              title="Excluir conta"
              onClick={(e) => {
                if (!confirm("Tem certeza que deseja excluir esta conta?")) {
                  e.preventDefault();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Form>
        )}
      </div>
    </div>
  );
}
