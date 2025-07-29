import { json, ActionFunctionArgs } from "@remix-run/node";

import { requireUser } from "~/domain/auth/auth.server";
import prismaClient from "~/lib/prisma/client.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { companyId, "account-type": accountType } = params;
  if (!companyId || !accountType) {
    return json({ error: "Missing parameters" }, { status: 400 });
  }

  const data = await request.json(); // espera [{id, order}]
  if (!Array.isArray(data)) {
    return json({ error: "Invalid payload" }, { status: 400 });
  }

  console.log({ data })

  try {
    // Valida se todos os grupos pertencem ao tipo correto
    const groupIds = data.map((g) => g.id);

    const groups = await prismaClient.dREGroup.findMany({
      where: {
        id: { in: groupIds },
        type: accountType, // garante que estamos alterando o tipo certo
      },
      select: { id: true },
    });



    if (groups.length !== groupIds.length) {
      return json({ error: "Some groups do not belong to this account type" }, { status: 400 });
    }

    // Atualiza ordem com transaction
    await prismaClient.$transaction(
      data.map((group) =>
        prismaClient.dREGroup.update({
          where: { id: group.id },
          data: { order: group.order },
        })
      )
    );

    return json({ success: true });
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to update order" }, { status: 500 });
  }
}
