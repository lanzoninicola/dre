import { redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import prismaClient from "~/lib/prisma/client.server";
import { destroySession, getUserSession } from "./session.server";

export async function getUser(request: Request) {
  const userId = await getUserSession(request);
  if (!userId) return null;

  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    include: {
      accountingFirm: true,
      company: true,
    },
  });

  return user;
}

export async function requireUser(request: Request) {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/login");
  }
  return user;
}

export async function requireAdminUser(request: Request) {
  const user = await getUser(request);

  if (!user) {
    throw redirect("/login");
  }

  if (user?.role !== "admin") {
    throw redirect("/login");
  }

  return user;
}

export async function logout(request: Request) {
  await destroySession(request);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
