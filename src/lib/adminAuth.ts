import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import { withAdminTables } from "@/lib/ensureAdminTables";

const ADMIN_SESSION_COOKIE = "swift_admin_session";
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12;

interface SignedAdminSessionPayload {
  sessionId: string;
  adminUserId: string;
  exp: number;
}

export interface AdminActor {
  sessionId: string;
  adminId: string;
  name: string;
  email: string;
  createdAt: Date | null;
  lastLoginAt: Date | null;
}

export interface AdminClientInfo {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface RegisterAdminInput {
  name?: string;
  email: string;
  registrationPassword: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function deriveNameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "";
  const normalized = localPart.replace(/[._-]+/g, " ").trim();

  if (!normalized) {
    return "Swift Type Admin";
  }

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDigitEnv(name: string, digits: number) {
  const value = process.env[name]?.trim() ?? "";
  const pattern = new RegExp(`^\\d{${digits}}$`);

  return pattern.test(value) ? value : null;
}

function getAdminSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    ""
  );
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  const secret = getAdminSessionSecret();

  if (!secret) {
    throw new Error(
      "Missing ADMIN_SESSION_SECRET or NEXTAUTH_SECRET for admin sessions",
    );
  }

  return createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

function encodeSessionToken(payload: SignedAdminSessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function decodeSessionToken(token: string): SignedAdminSessionPayload | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);

  if (expectedSignature.length !== signature.length) {
    return null;
  }

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const actualBuffer = Buffer.from(signature, "utf8");

  if (!timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(encodedPayload),
    ) as SignedAdminSessionPayload;

    if (
      !payload.sessionId ||
      !payload.adminUserId ||
      typeof payload.exp !== "number" ||
      Date.now() >= payload.exp
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function assertAdminRegistrationPassword(password: string) {
  const configuredPassword = getDigitEnv("ADMIN_REGISTRATION_PASSWORD", 10);

  if (!configuredPassword) {
    throw new Error(
      "ADMIN_REGISTRATION_PASSWORD must be configured as a 10-digit code",
    );
  }

  if (password !== configuredPassword) {
    throw new Error("Invalid admin registration password");
  }
}

function assertAdminLoginCode(code: string) {
  const configuredCode = getDigitEnv("ADMIN_LOGIN_CODE", 6);

  if (!configuredCode) {
    throw new Error(
      "ADMIN_LOGIN_CODE must be configured as a 6-digit code",
    );
  }

  if (code !== configuredCode) {
    throw new Error("Invalid admin login code");
  }
}

export function getAdminConfigStatus() {
  return {
    hasRegistrationPassword: Boolean(
      getDigitEnv("ADMIN_REGISTRATION_PASSWORD", 10),
    ),
    hasLoginCode: Boolean(getDigitEnv("ADMIN_LOGIN_CODE", 6)),
    hasSessionSecret: Boolean(getAdminSessionSecret()),
  };
}

export async function registerAdmin(input: RegisterAdminInput) {
  assertAdminRegistrationPassword(input.registrationPassword);

  const normalizedEmail = normalizeEmail(input.email);
  const name = input.name?.trim() || deriveNameFromEmail(normalizedEmail);

  return withAdminTables(async () => {
    const [existingAdmin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, normalizedEmail))
      .limit(1);

    if (existingAdmin) {
      throw new Error("Admin account already exists for this email");
    }

    const [admin] = await db
      .insert(adminUsers)
      .values({
        id: crypto.randomUUID(),
        name,
        email: normalizedEmail,
      })
      .returning();

    return admin;
  });
}

export async function authenticateAdmin(email: string, code: string) {
  assertAdminLoginCode(code);
  const normalizedEmail = normalizeEmail(email);

  return withAdminTables(async () => {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(
        and(eq(adminUsers.email, normalizedEmail), eq(adminUsers.isActive, true)),
      )
      .limit(1);

    if (!admin) {
      return null;
    }

    const now = new Date();

    await db
      .update(adminUsers)
      .set({ lastLoginAt: now })
      .where(eq(adminUsers.id, admin.id));

    return {
      ...admin,
      lastLoginAt: now,
    };
  });
}

export async function createAdminSession(
  adminId: string,
  clientInfo?: AdminClientInfo,
) {
  const now = new Date();

  return withAdminTables(async () => {
    const [session] = await db
      .insert(adminSessions)
      .values({
        id: crypto.randomUUID(),
        adminUserId: adminId,
        ipAddress: clientInfo?.ipAddress ?? null,
        userAgent: clientInfo?.userAgent ?? null,
        createdAt: now,
        lastSeenAt: now,
      })
      .returning();

    return encodeSessionToken({
      sessionId: session.id,
      adminUserId: adminId,
      exp: Date.now() + ADMIN_SESSION_TTL_MS,
    });
  });
}

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_MS / 1000,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!rawToken) {
    return null;
  }

  const payload = decodeSessionToken(rawToken);

  if (!payload) {
    return null;
  }

  return withAdminTables(async () => {
    const [adminSession] = await db
      .select({
        sessionId: adminSessions.id,
        adminId: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        createdAt: adminUsers.createdAt,
        lastLoginAt: adminUsers.lastLoginAt,
      })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.adminUserId))
      .where(
        and(
          eq(adminSessions.id, payload.sessionId),
          eq(adminSessions.adminUserId, payload.adminUserId),
          eq(adminUsers.isActive, true),
          isNull(adminSessions.endedAt),
        ),
      )
      .limit(1);

    return adminSession ?? null;
  });
}

export async function touchAdminSession(sessionId: string) {
  return withAdminTables(async () => {
    await db
      .update(adminSessions)
      .set({ lastSeenAt: new Date() })
      .where(and(eq(adminSessions.id, sessionId), isNull(adminSessions.endedAt)));
  });
}

export async function endAdminSession(sessionId: string) {
  return withAdminTables(async () => {
    await db
      .update(adminSessions)
      .set({ endedAt: new Date(), lastSeenAt: new Date() })
      .where(and(eq(adminSessions.id, sessionId), isNull(adminSessions.endedAt)));
  });
}