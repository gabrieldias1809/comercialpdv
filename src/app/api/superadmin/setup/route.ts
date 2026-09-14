import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    // Check if any admin already exists
    const count = await prisma.platformAdmin.count();
    if (count > 0) {
      return NextResponse.json({ error: "O Super Admin já foi configurado." }, { status: 403 });
    }

    // In a real app, hash the password (e.g., using bcrypt)
    // For MVP, we'll use a plain text comparison or simple base64 (not secure for production)
    const passwordHash = Buffer.from(password).toString("base64");

    const admin = await prisma.platformAdmin.create({
      data: {
        email,
        passwordHash
      }
    });

    return NextResponse.json({ success: true, adminId: admin.id });
  } catch (error: any) {
    console.error("Superadmin Setup Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor: " + String(error.message || error) }, { status: 500 });
  }
}
