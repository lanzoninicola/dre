import { createCookieSessionStorage, redirect } from "@remix-run/node";
import prismaClient from "~/lib/prisma/client.server";

const sessionSecret = process.env.SESSION_SECRET || "default_secret";
export const storage = createCookieSessionStorage({
  cookie: {
    name: "session",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: false,
  },
});

export async function createUserSession(userId, redirectTo) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export async function requireUser(request) {
  const session = await storage.getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) throw redirect("/login");
  return await prismaClient.user.findUnique({ where: { id: userId } });
}

export async function destroyUserSession(request) {
  const session = await storage.getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}
