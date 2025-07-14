// routes/home.tsx
import { json, LoaderFunction } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { AppSidebar } from "~/components/app-sidebar/app-sidebar";
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";
import { requireUser } from "~/domain/auth/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);

  return json({
    user
  })
}

export default function Iniçio() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        {/* <SiteHeader /> */}

        <Outlet />
      </SidebarInset>
    </SidebarProvider>


  );
}

