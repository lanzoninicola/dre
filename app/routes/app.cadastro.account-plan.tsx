import { Outlet } from "@remix-run/react";
import { PageLayout } from "~/components/layouts/page-layout";


export default function AppCadastroAccountingPlanOutlet() {


  return (
    <PageLayout
      title="Planos da conta"
      subtitle="Gerencie as contas contábeis e organize entre grupos DRE"
    >
      <Outlet />
    </PageLayout>
  )
}