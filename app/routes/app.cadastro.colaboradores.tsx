import { Outlet } from "@remix-run/react";
import { PageLayout } from "~/components/layouts/page-layout";


export default function AppCadastroColaboradoresOutlet() {


  return (
    <PageLayout
      title="Colaboradores"
      subtitle="Gerencie os colaboradores do seu escritorio"
    >
      <Outlet />
    </PageLayout>
  )
}