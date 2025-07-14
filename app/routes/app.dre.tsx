import { Outlet } from "@remix-run/react";
import { PageLayout } from "~/components/layouts/page-layout";

export default function DreOutlet() {
  return (
    <PageLayout
      title="Demonstração do Resultado do Exercício"
      subtitle=""
    >
      <Outlet />
    </PageLayout>
  )
}