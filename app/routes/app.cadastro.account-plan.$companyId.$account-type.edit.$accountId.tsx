import { LoaderFunction, ActionFunction, json, redirect } from "@remix-run/node"
import { useLoaderData, Form, useNavigate } from "@remix-run/react"
import { useRef, useState } from "react"
import { requireUser } from "~/domain/auth/auth.server"
import { AccountPlanService } from "~/domain/account-plan/services/accoun-plan.service.server"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import prismaClient from "~/lib/prisma/client.server"

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireUser(request)
  const service = new AccountPlanService(user)

  const accountId = params.accountId!
  const companyId = params.companyId!
  const accountType = params["account-type"]

  const result = await service.getById(accountId, companyId)
  const account = result.data

  const dreGroups = await prismaClient.dREGroup.findMany()
  const filteredGroups = dreGroups.filter(g => g.type === account.type)

  return json({ account, dreGroups: filteredGroups, companyId, accountType })
}

export const action: ActionFunction = async ({ request, params }) => {
  const user = await requireUser(request)
  const service = new AccountPlanService(user)

  const form = await request.formData()
  const accountId = params.accountId!
  const companyId = params.companyId!
  const accountType = params["account-type"]

  const code = form.get("name") as string
  const name = form.get("name") as string
  const type = form.get("type") as 'receita' | 'despesa'
  const dreGroupId = form.get("dreGroupId") as string

  await service.update(companyId, accountId, {
    code,
    name,
    type,
    dreGroupId
  })

  return redirect(`/cadastro/account-plan/${companyId}/${accountType}?success=${encodeURIComponent("Conta atualizada com sucesso")}`)
}

export default function EditAccountModal() {
  const { account, dreGroups, companyId, accountType } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const formRef = useRef<HTMLFormElement>(null)

  const closeModal = () => {
    setOpen(false)
    navigate("..")
  }

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Conta: <span className="text-muted-foreground">{account.name}</span></DialogTitle>
        </DialogHeader>

        <Form method="post" className="space-y-4" ref={formRef}>
          <Input name="code" defaultValue={account.code} required placeholder="Codigp" />
          <Input name="name" defaultValue={account.name} required placeholder="Nome da conta" />

          <Select name="type" defaultValue={account.type} required>
            <SelectTrigger>
              <SelectValue placeholder="Tipo da conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-1">
            <label className="text-sm font-medium">Grupo DRE</label>
            <Select name="dreGroupId" defaultValue={account.dreGroupId || undefined} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grupo" />
              </SelectTrigger>
              <SelectContent>
                {dreGroups.map((group: any) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button type="submit">Salvar Alterações</Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
