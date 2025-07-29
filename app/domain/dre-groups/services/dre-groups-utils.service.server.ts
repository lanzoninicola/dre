import prismaClient from "~/lib/prisma/client.server";
import { DREGroupsValidationService } from "./dre-groups-validation.service.server";

export class DreGroupsUtilsService {
  async reorder(groups: { id: string }[], type: string) {
    const validType = DREGroupsValidationService.validateType(type);
    const baseOrder = DREGroupsValidationService.getBaseOrderByType(validType);

    const orderedGroups = groups.map((g, idx) => ({
      id: g.id,
      order: baseOrder + idx + 1,
    }));

    console.log({
      receivedGroups: groups,
      type: validType,
      baseOrder,
      orderedGroups,
    });

    // Passo 1: Zera ordens para evitar conflitos
    await prismaClient.$transaction(
      groups.map((g) =>
        prismaClient.dREGroup.update({
          where: { id: g.id },
          data: { order: null },
        })
      )
    );

    // Passo 2: Aplica nova ordem
    return prismaClient.$transaction(
      orderedGroups.map((group) =>
        prismaClient.dREGroup.update({
          where: { id: group.id },
          data: { order: group.order },
        })
      )
    );
  }
}
