const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Admin@1234', 10);

  // ─── Users ──────────────────────────────────────────────────────────────────
  const users = [
    { name:'System Administrator', email:'admin@university.edu',   password, role:'ADMIN',            department:'IT Administration' },
    { name:'Academic Dean',        email:'dean@university.edu',    password, role:'ACADEMIC_DEAN',    department:'Academic Affairs' },
    { name:'Department Head',      email:'head@university.edu',    password, role:'DEPARTMENT_HEAD',  department:'Computer Science' },
    { name:'Resource Officer',     email:'officer@university.edu', password, role:'RESOURCE_OFFICER', department:'Logistics' },
    { name:'Senior Technician',    email:'tech@university.edu',    password, role:'TECHNICIAN',       department:'Maintenance' },
    { name:'Jane Smith',           email:'jane@university.edu',    password, role:'STAFF',            department:'Computer Science' },
    { name:'John Doe',             email:'john@university.edu',    password, role:'STAFF',            department:'Engineering' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role:u.role, department:u.department, name:u.name },
      create: u,
    });
  }
  console.log('✅ Users seeded (7 accounts, password: Admin@1234)');

  // ─── Resources ──────────────────────────────────────────────────────────────
  const resources = [
    { name:'Dell XPS 15 Laptop',      type:'ELECTRONICS',   location:'Lab 101',           purchaseDate:new Date('2023-01-15'), purchasePrice:1500, status:'AVAILABLE' },
    { name:'Herman Miller Chair',      type:'FURNITURE',     location:'Office 202',        purchaseDate:new Date('2022-05-20'), purchasePrice:800,  status:'IN_USE' },
    { name:'Epson 4K Projector',       type:'ELECTRONICS',   location:'Conference Room A', purchaseDate:new Date('2021-11-10'), purchasePrice:2000, status:'DAMAGED' },
    { name:'Canon i-SENSYS Printer',   type:'PRINTING',      location:'Admin Block',       purchaseDate:new Date('2022-08-01'), purchasePrice:600,  status:'AVAILABLE' },
    { name:'Network Switch 24-Port',   type:'NETWORKING',    location:'Server Room',       purchaseDate:new Date('2020-03-15'), purchasePrice:900,  status:'IN_USE' },
    { name:'Oscilloscope Dual-Channel',type:'LAB_EQUIPMENT', location:'Physics Lab',       purchaseDate:new Date('2019-06-12'), purchasePrice:3500, status:'AVAILABLE' },
    { name:'Standing Desk (Motorised)',type:'FURNITURE',     location:'Staff Lounge',      purchaseDate:new Date('2023-07-22'), purchasePrice:1200, status:'AVAILABLE' },
    { name:'HP ProBook 450 Laptop',    type:'ELECTRONICS',   location:'Library Lab',       purchaseDate:new Date('2018-09-01'), purchasePrice:1100, status:'DAMAGED' },
  ];

  // Only create if none exist (avoid duplication on re-seed)
  const existingCount = await prisma.resource.count();
  if (existingCount === 0) {
    for (const r of resources) await prisma.resource.create({ data:r });
    console.log(`✅ Resources seeded (${resources.length} items)`);
  } else {
    console.log(`ℹ️  Resources skipped (${existingCount} already exist)`);
  }

  // ─── Price Catalog ──────────────────────────────────────────────────────────
  const catalog = [
    { resourceType:'ELECTRONICS',   repairCost:300,  newPrice:1200 },
    { resourceType:'FURNITURE',     repairCost:100,  newPrice:500  },
    { resourceType:'LAB_EQUIPMENT', repairCost:500,  newPrice:2500 },
    { resourceType:'PRINTING',      repairCost:150,  newPrice:600  },
    { resourceType:'NETWORKING',    repairCost:200,  newPrice:900  },
  ];

  for (const c of catalog) {
    await prisma.priceCatalog.upsert({
      where: { resourceType:c.resourceType },
      update: c, create: c
    });
  }
  console.log(`✅ Price Catalog seeded (${catalog.length} categories)`);
  console.log('\n📋 Login credentials (all use password: Admin@1234)');
  console.log('   admin@university.edu    → ADMIN');
  console.log('   dean@university.edu     → ACADEMIC_DEAN');
  console.log('   head@university.edu     → DEPARTMENT_HEAD');
  console.log('   officer@university.edu  → RESOURCE_OFFICER');
  console.log('   tech@university.edu     → TECHNICIAN');
  console.log('   jane@university.edu     → STAFF');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
