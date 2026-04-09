import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

const connectionString = process.env.DATABASE_URL;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!email || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  if (!connectionString) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordHash = await hashPassword(newPassword);
    const credentialAccount = user.accounts.find((account) => account.providerId === "credential");

    if (credentialAccount) {
      await prisma.account.update({
        where: { id: credentialAccount.id },
        data: { password: passwordHash, updatedAt: new Date() },
      });
    } else {
      await prisma.account.create({
        data: {
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
