import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "@/lib/db";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
}

if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is not set");
}

export const auth = betterAuth({
  baseURL,
  secret,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    fields: {
      image: "avatarUrl",
    },
  },
});
