import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, users, verificationTokens } from "@/db/schema";
import { withUsersPasswordColumn } from "@/lib/ensureUsersPasswordColumn";

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

const googleClientId = readEnv("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID");
const googleClientSecret = readEnv(
  "AUTH_GOOGLE_SECRET",
  "AUTH_GOOGLE_CLIENT_SECRET",
  "GOOGLE_CLIENT_SECRET",
);
const googleClientIdExtended = googleClientId ?? readEnv("AUTH_GOOGLE_CLIENT_ID");
const githubClientId = readEnv("AUTH_GITHUB_ID", "GITHUB_CLIENT_ID");
const githubClientSecret = readEnv(
  "AUTH_GITHUB_SECRET",
  "AUTH_GITHUB_CLIENT_SECRET",
  "GITHUB_CLIENT_SECRET",
);
const githubClientIdExtended = githubClientId ?? readEnv("AUTH_GITHUB_CLIENT_ID");

const isGoogleConfigured = Boolean(googleClientIdExtended && googleClientSecret);
const isGitHubConfigured = Boolean(githubClientIdExtended && githubClientSecret);

if (
  (googleClientIdExtended && !googleClientSecret) ||
  (!googleClientIdExtended && googleClientSecret)
) {
  console.warn(
    "Google OAuth is partially configured. Set both AUTH_GOOGLE_ID/AUTH_GOOGLE_CLIENT_ID and AUTH_GOOGLE_SECRET/AUTH_GOOGLE_CLIENT_SECRET (or GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET).",
  );
}

if (
  (githubClientIdExtended && !githubClientSecret) ||
  (!githubClientIdExtended && githubClientSecret)
) {
  console.warn(
    "GitHub OAuth is partially configured. Set both AUTH_GITHUB_ID/AUTH_GITHUB_CLIENT_ID and AUTH_GITHUB_SECRET/AUTH_GITHUB_CLIENT_SECRET (or GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET).",
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: readEnv("AUTH_SECRET", "NEXTAUTH_SECRET"),
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    ...(isGoogleConfigured
      ? [
          Google({
            clientId: googleClientIdExtended,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    ...(isGitHubConfigured
      ? [
          GitHub({
            clientId: githubClientIdExtended,
            clientSecret: githubClientSecret,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await withUsersPasswordColumn(() =>
          db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1),
        );

        if (!user?.password) return null; // Fallback to OAuth if password missing

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (passwordsMatch) return user;
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
