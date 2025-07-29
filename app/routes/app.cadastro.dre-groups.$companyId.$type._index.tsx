import { useLoaderData, useFetcher } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/domain/auth/auth.server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createDREGroupsService } from "~/domain/dre-groups/services/dre-groups.service.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId!;
  const groupType = params["type"]! as "receita" | "despesa";

  if (!user) throw new Response("Autorização negada", { status: 401 });

  const dreGroupService = createDREGroupsService(user)

  const result = await dreGroupService.getByType(companyId, groupType);

  if (!result.success) throw new Response(result.error, { status: 400 });


  return json({
    dreGroups: result.data.dreGroups,
    groupType,
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

export default function DreGroupsCompanyIdType() {
  const { dreGroups, companyId, groupType } = useLoaderData<typeof loader>();

  const [groups, setGroups] = useState([...dreGroups].sort((a, b) => a.order - b.order));
  const [isReordering, setIsReordering] = useState(false);

  const fetcher = useFetcher();
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groups.findIndex((g) => g.id === active.id);
    const newIndex = groups.findIndex((g) => g.id === over.id);

    // Atualiza visualmente a ordem no estado
    const newGroups = arrayMove(groups, oldIndex, newIndex);
    setGroups(newGroups);

    // Envia apenas IDs na nova ordem para o backend
    if (isReordering) {
      fetcher.submit(
        JSON.stringify(newGroups.map((g) => ({ id: g.id }))),
        {
          method: "post",
          action: `/app/cadastro/dre-groups/${companyId}/${groupType}/reorder`,
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
                      <CardTitle className="text-lg font-bold text-gray-900" style={{ marginTop: 0 }} data-name="card-title">
                        {group.name}
                      </CardTitle>
                    </CardHeader>

                    <Separator />


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
