import { useLoaderData, useFetcher } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "react-router";
import AccountRow from "~/domain/account-plan/components/account-row";
import { createAccountPlanService } from "~/domain/account-plan/services/accoun-plan.service.server";
import { requireUser } from "~/domain/auth/auth.server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";
import { cn } from "~/lib/utils";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId!;
  const accountType = params["account-type"]! as "receita" | "despesa";

  if (!user) throw new Response("Autorização negada", { status: 401 });

  const accountPlanService = createAccountPlanService({
    id: user.id,
    role: user.role,
    accountingFirmId: user?.accountingFirmId ?? undefined,
  });

  const result = await accountPlanService.getAccountPlanDataByType(companyId, accountType);

  if (!result.success) throw new Response(result.error, { status: 400 });

  // Filtra grupos apenas do tipo atual
  const filteredGroups = result.data.dreGroups.filter(
    (g) => g.type.toLowerCase() === accountType
  );

  return json({
    ...result.data,
    dreGroups: filteredGroups,
    accountType,
    companyId,
  });
}


function SortableGroup({ group, children, isReordering }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: group.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isReordering ? "grab" : "default",
  };

  return (
    <div ref={setNodeRef} style={style} {...(isReordering ? { ...attributes, ...listeners } : {})}>
      {children}
    </div>
  );
}

export default function AccountPlanCompanyIdType() {
  const { accounts, dreGroups, companyId, accountType } = useLoaderData<typeof loader>();

  const [groups, setGroups] = useState([...dreGroups].sort((a, b) => a.order - b.order));
  const [isReordering, setIsReordering] = useState(false);

  const fetcher = useFetcher();
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groups.findIndex((g) => g.id === active.id);
    const newIndex = groups.findIndex((g) => g.id === over.id);

    const newGroups = arrayMove(groups, oldIndex, newIndex).map((g, idx) => ({
      ...g,
      order: idx + 1,
    }));

    setGroups(newGroups);

    // Apenas salva se estiver no modo reordering
    if (isReordering) {
      fetcher.submit(
        JSON.stringify(newGroups.map((g) => ({ id: g.id, order: g.order }))),
        {
          method: "post",
          action: `/app/cadastro/account-plan/${companyId}/${accountType}/reorder-groups`, // agora dinâmico
          encType: "application/json",
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Botão para habilitar/desabilitar ordenação */}
      <div className="flex justify-end">
        <Button
          variant={isReordering ? "default" : "outline"}
          onClick={() => setIsReordering((prev) => !prev)}
        >
          {isReordering ? "Salvar Ordem" : "Ativar Ordenação"}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={groups} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-4">
            {groups.map((group) => {
              const groupAccounts = accounts.filter(
                (account) => account.dreGroupId === group.id
              );

              if (groupAccounts.length === 0) return null;

              return (
                <SortableGroup key={group.id} group={group} isReordering={isReordering}>
                  <Card className="border shadow-sm">
                    <CardHeader className={
                      cn(
                        "pb-3 flex flex-row items-center gap-2 rounded-md",
                        isReordering ? "bg-gray-50" : "bg-white"
                      )
                    }>
                      {isReordering && (
                        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <p className="text-lg font-bold text-gray-900" data-name="card-title">
                        <span className="text-blue-600 mr-2">{group.order}.</span>
                        {group.name}
                      </p>
                    </CardHeader>

                    <Separator />

                    <CardContent className="p-0 divide-y">
                      {groupAccounts
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((account) => (
                          <AccountRow
                            key={account.id}
                            account={account}
                            companyId={companyId!}
                            dreGroups={dreGroups}
                          />
                        ))}
                    </CardContent>
                  </Card>
                </SortableGroup>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
