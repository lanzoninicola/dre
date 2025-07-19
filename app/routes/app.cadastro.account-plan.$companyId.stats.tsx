export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId!;

  const accountPlanService = createAccountPlanService(user);

  const [planResult, statsResult, validationResult] = await Promise.all([
    accountPlanService.getAccountPlanData(companyId),
    accountPlanService.getStats(companyId),
    accountPlanService.validateAccountPlan(companyId)
  ]);

  if (!planResult.success) {
    throw new Response(planResult.error, { status: 400 });
  }

  return json({
    company: { id: companyId },
    accounts: planResult.data.accounts,
    stats: statsResult.success ? statsResult.data : null,
    validation: validationResult.success ? validationResult : null,
    user
  });
}

export default function AccountPlanStatsPage() {
  const { company, accounts, stats, validation } = useLoaderData<typeof loader>();

  return (
    <div className="container-content">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-heading-1">Estatísticas do Plano de Contas</h1>
          <p className="text-muted mt-2">
            Análise detalhada das contas cadastradas
          </p>
        </div>
        <Link
          to={`/app/cadastro/account-plan/${company.id}`}
          className="btn-secondary"
        >
          Voltar ao Plano
        </Link>
      </div>

      {/* Estatísticas gerais */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-stat">
            <div className="text-sm font-medium text-gray-600">Total de Contas</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalAccounts}</div>
          </div>
          <div className="card-stat">
            <div className="text-sm font-medium text-gray-600">Contas de Receita</div>
            <div className="text-3xl font-bold text-green-600">{stats.receitaAccounts}</div>
          </div>
          <div className="card-stat">
            <div className="text-sm font-medium text-gray-600">Contas de Despesa</div>
            <div className="text-3xl font-bold text-red-600">{stats.despesaAccounts}</div>
          </div>
          <div className="card-stat">
            <div className="text-sm font-medium text-gray-600">Total de Transações</div>
            <div className="text-3xl font-bold text-blue-600">{stats.totalTransactions}</div>
          </div>
        </div>
      )}

      {/* Validação e problemas */}
      {validation && (
        <div className="card-default p-6 mb-8">
          <h3 className="text-heading-3 mb-4">Validação do Plano de Contas</h3>

          {validation.success ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-700 font-medium">✓ Plano de contas válido</p>
              <p className="text-green-600 text-sm mt-1">Nenhum problema encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {validation.data.duplicateNames.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-700 font-medium">⚠ Nomes Duplicados</p>
                  <p className="text-yellow-600 text-sm mt-1">
                    {validation.data.duplicateNames.length} conta(s) com nomes duplicados
                  </p>
                </div>
              )}

              {validation.data.invalidDREGroups.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-700 font-medium">✗ Grupos DRE Inválidos</p>
                  <p className="text-red-600 text-sm mt-1">
                    {validation.data.invalidDREGroups.length} conta(s) com grupos DRE incompatíveis
                  </p>
                </div>
              )}

              {validation.data.unusedAccounts.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-blue-700 font-medium">ℹ Contas Não Utilizadas</p>
                  <p className="text-blue-600 text-sm mt-1">
                    {validation.data.unusedAccounts.length} conta(s) sem transações
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Distribuição por grupos DRE */}
      <div className="card-default p-6">
        <h3 className="text-heading-3 mb-4">Distribuição por Grupos DRE</h3>
        <div className="space-y-3">
          {Object.entries(
            accounts.reduce((acc, account) => {
              const groupName = account.dreGroup.name;
              if (!acc[groupName]) {
                acc[groupName] = { count: 0, type: account.dreGroup.type };
              }
              acc[groupName].count++;
              return acc;
            }, {})
          ).map(([groupName, data]) => (
            <div key={groupName} className="flex justify-between items-center py-2">
              <span className="text-gray-700">{groupName}</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${data.type === 'receita'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                  }`}>
                  {data.type}
                </span>
                <span className="font-medium text-gray-900">{data.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}