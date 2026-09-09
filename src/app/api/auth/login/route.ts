import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha obrigatórios" }, { status: 400 });
    }

    // Attempt to query the database
    let store = null;
    let operators = [];

    try {
      store = await prisma.store.findUnique({
        where: { email },
        include: { operators: true }
      });
    } catch (dbError) {
      console.warn("Banco de dados não configurado, usando Mock para demonstração", dbError);
      // Fallback for Demo without DB
      if (email === "demo@mercadinho.com" && password === "123456") {
        return NextResponse.json({
          storeId: "demo-store",
          operators: [
            { pin: "0000", name: "Gerente Demo", role: "admin" },
            { pin: "1111", name: "Caixa Demo", role: "operator" }
          ]
        });
      }
    }

    if (!store) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Note: Em produção, usar bcrypt.compare
    if (store.passwordHash !== password) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    return NextResponse.json({
      storeId: store.id,
      operators: store.operators.map(op => ({
        pin: op.pin,
        name: op.name,
        role: op.role
      }))
    });
  } catch (error) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
