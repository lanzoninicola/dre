import { json, ActionFunctionArgs } from "@remix-run/node";
import { requireUser } from "~/domain/auth/auth.server";
import { DREGroupsValidationService } from "~/domain/dre-groups/services/dre-groups-validation.service.server";
import { DREGroupsService } from "~/domain/dre-groups/services/dre-groups.service.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = params.companyId!;
  const accountType = DREGroupsValidationService.validateType(params["account-type"] || "");

  const data = await request.json(); // espera [{id, order}]
  if (!Array.isArray(data)) {
    return json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    // Cria instância do serviço já com o contexto do usuário
    const service = new DREGroupsService(user);


    // Usa a função reorder do service (que delega para utilsService)
    await service.reorder(data, accountType);

    return json({ success: true });
  } catch (error) {
    console.error("Failed to reorder groups:", error);
    return json({ error: "Failed to update order" }, { status: 500 });
  }
}
