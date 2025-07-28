import {
  LoaderFunction,
  ActionFunction,
  json,
  redirect
} from "@remix-run/node"
import {
  useLoaderData,
  Form,
  useNavigate,
  useNavigation
} from "@remix-run/react"
import { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { requireUser } from "~/domain/auth/auth.server"
import { AccountPlanService } from "~/domain/account-plan/services/accoun-plan.service.server"
import prismaClient from "~/lib/prisma/client.server"

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireUser(request)
  const service = new AccountPlanService(user)

  const url = new URL(request.url)
  const accountId = url.searchParams.get("accountId")
  const companyId = params.companyId!
  const accountType = params["account-type"]

  if (!accountId || !companyId || !accountType) {
    throw new Response("Parâmetros ausentes", { status: 400 })
  }

  const result = await service.getById(accountId, companyId)
  const account = result.data

  if (!account || account.type !== accountType) {
    throw new Response("Conta não encontrada ou tipo incompatível", { status: 404 })
  }

  const dreGroups = await prismaClient.dREGroup.findMany()

  return json({ account, dreGroups })
}

export const action: ActionFunction = async ({ request, params }) => {
  const user = await requireUser(request)
  const service = new AccountPlanService(user)

  const form = await request.formData()
  const intent = form.get("intent")
  const accountId = form.get("accountId") as string
  const newDreGroupId = form.get("newDreGroupId") as string
  const companyId = params.companyId!
  const accountType = params["account-type"]

  if (intent !== "move" || !accountId || !newDreGroupId) {
    return json({ error: "Dados incompletos" }, { status: 400 })
  }

  const result = await service.moveAccountToGroup(accountId, companyId, newDreGroupId)

  if (!result.success) {
    return json({ error: result.error }, { status: 400 })
  }

  const redirectUrl = `/app/cadastro/account-plan/${companyId}/${accountType}?success=${encodeURIComponent("Conta movida com sucesso")}`
  return redirect(redirectUrl)
}

export default function MoveAccountModalPage() {
  const { account, dreGroups } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  const navigation = useNavigation()
  const formRef = useRef<HTMLFormElement>(null)

  const filteredGroups = dreGroups.filter(
    (g: any) => g.type === account.type && g.id !== account.dreGroup?.id
  )

  const [selectedGroup, setSelectedGroup] = useState<string | undefined>()
  const [initialGroupId, setInitialGroupId] = useState<string | null>(account.dreGroup?.id || null)

  // Foco automático
  const selectTriggerRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    setTimeout(() => selectTriggerRef.current?.focus(), 150)
  }, [])


  const closeModal = () => {
    if (selectedGroup && selectedGroup !== initialGroupId) {
      const confirmClose = confirm("Você alterou o grupo. Deseja sair sem salvar?")
      if (!confirmClose) return
    }
    setOpen(false)
    navigate("..")
  }

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Mover Conta: <span className="text-muted-foreground">{account.name}</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Grupo atual: <strong>{account.dreGroup?.name || "Nenhum"}</strong>
          </p>
        </DialogHeader>

        <Form method="post" className="space-y-4" ref={formRef}>
          <input type="hidden" name="intent" value="move" />
          <input type="hidden" name="accountId" value={account.id} />

          <div className="space-y-2">
            <label className="text-sm font-medium">Novo Grupo DRE</label>
            <Select
              name="newDreGroupId"
              required
              value={selectedGroup}
              onValueChange={(val) => setSelectedGroup(val)}
            >
              <SelectTrigger ref={selectTriggerRef}>
                <SelectValue placeholder="Selecione o grupo" />
              </SelectTrigger>
              <SelectContent>
                {filteredGroups.map((group: any) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!selectedGroup || navigation.state === "submitting"}>
              Mover
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
