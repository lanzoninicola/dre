import { Outlet } from "@remix-run/react";
import { PageLayout } from "~/components/layouts/page-layout";


export default function AppCadastroDreGroupsOutlet() {


  return (
    <PageLayout
      title="Grupos DRE"
      subtitle="Organize os grupos DRE"
    >
      <Outlet />
    </PageLayout>
  )
}