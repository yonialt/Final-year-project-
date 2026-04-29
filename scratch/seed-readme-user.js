const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const password = await bcrypt.hash('Secret@99', 10);
  const user = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: { password },
    create: {
      name: 'Jane Example',
      email: 'jane@example.com',
      password,
      role: 'ACADEMIC_DEAN'
    }
  });
  console.log('User updated/created:', user.email);
  await prisma.$disconnect();
}

run();
