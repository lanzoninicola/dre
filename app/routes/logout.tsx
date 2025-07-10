import type { LoaderFunction } from "@remix-run/node";
import { logout } from "~/domain/auth/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  return logout(request);
};