// routes/dashboard.tsx
import { json, LoaderFunction } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import {
  TrendingUp,
  DollarSign,
  FileText,
  Users
} from "lucide-react";
import { Navbar } from "~/components/layouts/nav-bar";
import { requireUser } from "~/domain/auth/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);

  return json({
    user
  })
}

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <Navbar user={user} />
      <Outlet />
    </>

  );
}