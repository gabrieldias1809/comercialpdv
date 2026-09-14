import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Auth Middleware Helper
const isAuthenticated = async () => {
  const cookieStore = await cookies();
  return cookieStore.has("superadminAuth");
};

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const stores = await prisma.store.findMany({
      include: {
        _count: {
          select: { operators: true, transactions: true }
        },
        transactions: {
          select: { totalAmount: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const formattedStores = stores.map(store => ({
      id: store.id,
      name: store.name,
      email: store.email,
      password: Buffer.from(store.passwordHash, 'base64').toString('utf-8'),
      createdAt: store.createdAt,
      operatorsCount: store._count.operators,
      transactionsCount: store._count.transactions,
      totalVolume: store.transactions.reduce((acc, t) => acc + t.totalAmount, 0)
    }));

    return NextResponse.json({ stores: formattedStores });
  } catch (error: any) {
    console.error("Superadmin Get Stores Error:", error);
    return NextResponse.json({ error: "Erro ao buscar lojas: " + String(error.message || error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, e-mail e senha são obrigatórios." }, { status: 400 });
    }

    const existingStore = await prisma.store.findUnique({ where: { email } });
    if (existingStore) {
      return NextResponse.json({ error: "E-mail já cadastrado para outra loja." }, { status: 400 });
    }

    // Hash the Store password
    const passwordHash = Buffer.from(password).toString("base64");

    const newStore = await prisma.store.create({
      data: {
        name,
        email,
        passwordHash,
      }
    });

    return NextResponse.json({ success: true, store: newStore });
  } catch (error: any) {
    console.error("Superadmin Create Store Error:", error);
    return NextResponse.json({ error: "Erro interno ao criar loja: " + String(error.message || error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { id, name, email, password } = await req.json();

    if (!id || !name || !email) {
      return NextResponse.json({ error: "ID, nome e e-mail são obrigatórios." }, { status: 400 });
    }

    const dataToUpdate: any = { name, email };
    
    if (password) {
      dataToUpdate.passwordHash = Buffer.from(password).toString("base64");
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, store: updatedStore });
  } catch (error: any) {
    console.error("Superadmin Edit Store Error:", error);
    return NextResponse.json({ error: "Erro interno ao editar loja: " + String(error.message || error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID da loja é obrigatório." }, { status: 400 });
    }

    // Prisma Cascade delete might not be fully configured, so we manually delete relations first if needed.
    // In our schema, we have onDelete: Cascade for SaleItem and Payment, but for Operator, Transaction and CashEvent we don't.
    // So we delete them manually to avoid foreign key constraints errors.
    await prisma.cashEvent.deleteMany({ where: { storeId: id } });
    await prisma.payment.deleteMany({ where: { transaction: { storeId: id } } });
    await prisma.saleItem.deleteMany({ where: { transaction: { storeId: id } } });
    await prisma.transaction.deleteMany({ where: { storeId: id } });
    await prisma.operator.deleteMany({ where: { storeId: id } });

    await prisma.store.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Superadmin Delete Store Error:", error);
    return NextResponse.json({ error: "Erro interno ao excluir loja: " + String(error.message || error) }, { status: 500 });
  }
}
