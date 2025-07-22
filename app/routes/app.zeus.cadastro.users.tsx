import { Outlet } from "@remix-run/react";
import { PageLayout } from "~/components/layouts/page-layout";


// !!!!! ACESSO SOMENTE PARA SUPER ADMIN SUPORTE DO SOFTWARE




export default function AppZeusCadastroUsersOutlet() {


  return (
    <PageLayout
      title="Usuarios"
      subtitle="Gerenciamento usuarios"
    >
      <Outlet />
    </PageLayout>
  )
}