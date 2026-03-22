import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { withUsersPasswordColumn } from "@/lib/ensureUsersPasswordColumn";

function deriveNameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "";
  const normalized = localPart.replace(/[._-]+/g, " ").trim();

  if (!normalized) {
    return "Swift Type User";
  }

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const email = String(payload.email ?? "").trim().toLowerCase();
    const password = String(payload.password ?? "");
    const providedName = String(payload.name ?? "").trim();
    const name = providedName || deriveNameFromEmail(email);

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Check if user already exists
    const [existingUser] = await withUsersPasswordColumn(() =>
      db.select().from(users).where(eq(users.email, email)).limit(1)
    );

    if (existingUser) {
      // 2. If user exists without a password, they used OAuth
      if (!existingUser.password) {
        return NextResponse.json(
          { message: "Account setup via Google/GitHub. Please use those providers to sign in." },
          { status: 409 }
        );
      }
      // 3. User already registered via native email/pass
      return NextResponse.json(
        { message: "Account already exists! Please go to Sign In." },
        { status: 409 }
      );
    }

    // 4. Create new native user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
