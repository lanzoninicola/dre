import { Outlet } from "@remix-run/react";
import { PageLayout } from "~/components/layouts/page-layout";

export default function TransacoesOutlet() {
  return (
    <PageLayout
      title="Transações Bancárias"
      subtitle="Selecione uma empresa para visualiza e classificar as transações"
    >
      <Outlet />
    </PageLayout>
  )
}