import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    const passwordHash = Buffer.from(password).toString("base64");

    const admin = await prisma.platformAdmin.findUnique({
      where: { email }
    });

    if (!admin || admin.passwordHash !== passwordHash) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const res = NextResponse.json({ success: true, adminId: admin.id });
    
    // Set a simple cookie for MVP auth
    res.cookies.set("superadminAuth", admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return res;
  } catch (error: any) {
    console.error("Superadmin Login Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
