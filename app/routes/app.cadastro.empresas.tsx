import { Outlet } from "@remix-run/react";
import { PageLayout } from "~/components/layouts/page-layout";


export default function AppCadastroEmpresasOutlet() {


  return (
    <PageLayout
      title="Empresas"
      subtitle="Gerencie as suas empresas"
    >
      <Outlet />
    </PageLayout>
  )
}