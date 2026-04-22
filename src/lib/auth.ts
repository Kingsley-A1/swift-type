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
  "GOOGLE_CLIENT_SECRET",
);
const githubClientId = readEnv("AUTH_GITHUB_ID", "GITHUB_CLIENT_ID");
const githubClientSecret = readEnv(
  "AUTH_GITHUB_SECRET",
  "GITHUB_CLIENT_SECRET",
);

const isGoogleConfigured = Boolean(googleClientId && googleClientSecret);
const isGitHubConfigured = Boolean(githubClientId && githubClientSecret);

if (process.env.NODE_ENV === "production") {
  if ((googleClientId && !googleClientSecret) || (!googleClientId && googleClientSecret)) {
    console.warn(
      "Google OAuth is partially configured. Set both AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET (or GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET).",
    );
  }

  if ((githubClientId && !githubClientSecret) || (!githubClientId && githubClientSecret)) {
    console.warn(
      "GitHub OAuth is partially configured. Set both AUTH_GITHUB_ID and AUTH_GITHUB_SECRET (or GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET).",
    );
  }
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
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    ...(isGitHubConfigured
      ? [
          GitHub({
            clientId: githubClientId,
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

        if (!user || !user.password) return null; // Fallback to OAuth if password missing

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
