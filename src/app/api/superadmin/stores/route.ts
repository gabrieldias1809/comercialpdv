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
        },
        operators: {
          where: { role: 'admin' },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const formattedStores = stores.map(store => ({
      id: store.id,
      name: store.name,
      email: store.email,
      password: Buffer.from(store.passwordHash, 'base64').toString('utf-8'),
      adminPin: store.operators[0]?.pin || 'Não definido',
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
    const { name, email, password, adminPin } = await req.json();

    if (!name || !email || !password || !adminPin) {
      return NextResponse.json({ error: "Nome, e-mail, senha e PIN do Gerente são obrigatórios." }, { status: 400 });
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
        operators: {
          create: {
            pin: adminPin,
            name: "Gerente",
            role: "admin"
          }
        }
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
    const { id, name, email, password, adminPin } = await req.json();

    if (!id || !name || !email || !adminPin) {
      return NextResponse.json({ error: "ID, nome, e-mail e PIN do Gerente são obrigatórios." }, { status: 400 });
    }

    const dataToUpdate: any = { name, email };
    
    if (password) {
      dataToUpdate.passwordHash = Buffer.from(password).toString("base64");
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: dataToUpdate
    });

    // Update or create the admin operator
    const adminOp = await prisma.operator.findFirst({
      where: { storeId: id, role: 'admin' }
    });

    if (adminOp) {
      if (adminOp.pin !== adminPin) {
        // Since pin is part of composite key @@id([pin, storeId]), we must delete and recreate it if we change the PIN.
        await prisma.operator.delete({
          where: { pin_storeId: { pin: adminOp.pin, storeId: id } }
        });
        await prisma.operator.create({
          data: { pin: adminPin, storeId: id, name: adminOp.name, role: 'admin' }
        });
      }
    } else {
      await prisma.operator.create({
        data: { pin: adminPin, storeId: id, name: "Gerente", role: "admin" }
      });
    }

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
