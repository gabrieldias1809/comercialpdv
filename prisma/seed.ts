import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding initial store...");
  const store = await prisma.store.upsert({
    where: { email: 'contato@mercadinho.com' },
    update: {},
    create: {
      name: 'Meu Mercadinho SaaS',
      email: 'contato@mercadinho.com',
      passwordHash: 'senha123', // Em produção, usar bcrypt
      operators: {
        create: [
          {
            pin: '0000',
            name: 'Dono (Gerente)',
            role: 'admin',
          },
          {
            pin: '1234',
            name: 'Caixa 1',
            role: 'operator',
          }
        ]
      }
    }
  });
  
  console.log("Store created!", store);
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
