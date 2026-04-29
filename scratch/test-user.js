const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const password = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: { password },
    create: {
      name: 'Test User',
      email: 'test@example.com',
      password,
      role: 'ACADEMIC_DEAN'
    }
  });
  console.log('User updated/created:', user.email);
  await prisma.$disconnect();
}

run();
