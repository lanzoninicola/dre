import type { ActionFunction } from "@remix-run/node";
import { logout } from "~/domain/auth/auth.server";

export const action: ActionFunction = async ({ request }) => {
  return logout(request);
};