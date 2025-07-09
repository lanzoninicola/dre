import { Authenticator } from "remix-auth";
import { LoggedUser } from "./types.server";
import { createCookieSessionStorage } from "@remix-run/node";

const cookieSecret = process.env.COOKIE_SECRET || "cookie_secret";

// Personalize this options for your usage.
const cookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 24 * 60 * 60 * 1000 * 30,
  secrets: [cookieSecret],
  secure: process.env.NODE_ENV !== "development",
};

const sessionStorage = createCookieSessionStorage({
  cookie: cookieOptions,
});

export const authenticator = new Authenticator<LoggedUser>(sessionStorage, {
  throwOnError: true,
});
