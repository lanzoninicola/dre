// https://www.npmjs.com/package/remix-auth-google

import { GoogleStrategy } from "remix-auth-google";
import {
  GOOGLE_CALLBACK_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from "./constants.server";
import { LoggedUser } from "./types.server";
import { authenticator } from "./authenticator.server";

let googleStrategy = new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID || "",
    clientSecret: GOOGLE_CLIENT_SECRET || "",
    callbackURL: GOOGLE_CALLBACK_URL || "",
  },
  async ({ accessToken, refreshToken, extraParams, profile }) => {
    // Get the user data from your DB or API using the tokens and profile
    // return User.findOrCreate({ email: profile.emails[0].value });

    // const profileDomain = profile._json.hd;

    // if (profileDomain !== "limbersoftware.com.br") {
    //   return null;
    // }
    const emailWhitelist = process.env.GOOGLE_AUTH_EMAIL_WHITELIST;
    const emailWhitelistArray = emailWhitelist?.split(",");

    const emailInbound = profile.emails[0].value;

    if (!emailInbound) {
      return null;
    }

    if (!emailWhitelist) {
      return null;
    }

    if (emailWhitelistArray && !emailWhitelistArray.includes(emailInbound)) {
      return false;
    }

    const user: LoggedUser = {
      name: profile.displayName,
      email: emailInbound,
      avatarURL: profile.photos[0].value,
    };

    console.log("google.server.ts", user);

    return user;
  }
);

authenticator.use(googleStrategy);
