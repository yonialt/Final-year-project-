const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Admin@1234', 10);

  // ─── Users ──────────────────────────────────────────────────────────────────
  const users = [
    { name:'System Administrator', email:'admin@uog.edu.et',    password, role:'ADMIN',            department:'IT Administration' },
    { name:'Dr. Solomon Teklu',    email:'dean@uog.edu.et',     password, role:'ACADEMIC_DEAN',    department:'Academic Affairs' },
    { name:'Prof. Amare Getachew', email:'head@uog.edu.et',     password, role:'DEPARTMENT_HEAD',  department:'Computer Science' },
    { name:'Tigist Belay',         email:'officer@uog.edu.et',  password, role:'RESOURCE_OFFICER', department:'Logistics & Procurement' },
    { name:'Dawit Mekonnen',       email:'tech@uog.edu.et',     password, role:'TECHNICIAN',       department:'Maintenance Unit' },
    { name:'Yohannes Tadesse',     email:'tech2@uog.edu.et',    password, role:'TECHNICIAN',       department:'Maintenance Unit' },
    { name:'Hana Mulugeta',        email:'hana@uog.edu.et',     password, role:'STAFF',            department:'Computer Science' },
    { name:'Abel Demisse',         email:'abel@uog.edu.et',     password, role:'STAFF',            department:'Computer Science' },
    { name:'Selam Worku',          email:'selam@uog.edu.et',    password, role:'STAFF',            department:'Engineering' },
    { name:'Dr. Biniam Hailu',     email:'head2@uog.edu.et',    password, role:'DEPARTMENT_HEAD',  department:'Engineering' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role:u.role, department:u.department, name:u.name },
      create: u,
    });
  }
  console.log('✅ Users seeded (10 accounts, password: Admin@1234)');

  // ─── Resources ──────────────────────────────────────────────────────────────
  const resources = [
    { name:'Dell XPS 15 Laptop',        type:'ELECTRONICS',   location:'Computer Lab 101',      purchaseDate:new Date('2023-01-15'), purchasePrice:1500, status:'AVAILABLE' },
    { name:'Herman Miller Aeron Chair', type:'FURNITURE',     location:'Office 202, CS Dept',   purchaseDate:new Date('2022-05-20'), purchasePrice:800,  status:'IN_USE' },
    { name:'Epson 4K Projector EB-2265U',type:'ELECTRONICS',  location:'Conference Room A',     purchaseDate:new Date('2021-11-10'), purchasePrice:2000, status:'DAMAGED' },
    { name:'Canon i-SENSYS MF645Cx',    type:'PRINTING',      location:'Admin Block 1F',        purchaseDate:new Date('2022-08-01'), purchasePrice:600,  status:'AVAILABLE' },
    { name:'Cisco Catalyst 2960X',      type:'NETWORKING',    location:'Server Room B2',        purchaseDate:new Date('2020-03-15'), purchasePrice:900,  status:'IN_USE' },
    { name:'Tektronix TDS 2024C',       type:'LAB_EQUIPMENT', location:'Physics Lab 3',         purchaseDate:new Date('2019-06-12'), purchasePrice:3500, status:'AVAILABLE' },
    { name:'FlexiSpot E7 Standing Desk',type:'FURNITURE',     location:'Staff Lounge',          purchaseDate:new Date('2023-07-22'), purchasePrice:1200, status:'AVAILABLE' },
    { name:'HP ProBook 450 G8',         type:'ELECTRONICS',   location:'Library Computer Lab',  purchaseDate:new Date('2018-09-01'), purchasePrice:1100, status:'DAMAGED' },
    { name:'Brother HL-L2375DW',        type:'PRINTING',      location:'Engineering Dept 3F',   purchaseDate:new Date('2021-03-10'), purchasePrice:350,  status:'AVAILABLE' },
    { name:'Keysight 34461A DMM',       type:'LAB_EQUIPMENT', location:'Electronics Lab 2',     purchaseDate:new Date('2020-01-20'), purchasePrice:4200, status:'IN_USE' },
    { name:'Lenovo ThinkPad X1 Carbon', type:'ELECTRONICS',   location:'Dean Office',           purchaseDate:new Date('2022-02-14'), purchasePrice:1800, status:'IN_USE' },
    { name:'TP-Link TL-SG1024',         type:'NETWORKING',    location:'Network Closet 1F',     purchaseDate:new Date('2021-08-05'), purchasePrice:450,  status:'AVAILABLE' },
  ];

  const existingCount = await prisma.resource.count();
  if (existingCount === 0) {
    for (const r of resources) await prisma.resource.create({ data: r });
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
      where: { resourceType: c.resourceType },
      update: c, create: c
    });
  }
  console.log(`✅ Price Catalog seeded (${catalog.length} categories)`);

  // ─── Sample Damage Reports ────────────────────────────────────────────────
  const damageCount = await prisma.damageReport.count();
  if (damageCount === 0) {
    const hana = await prisma.user.findUnique({ where: { email: 'hana@uog.edu.et' } });
    const epson = await prisma.resource.findFirst({ where: { name: { contains: 'Epson' } } });
    const hp = await prisma.resource.findFirst({ where: { name: { contains: 'HP ProBook' } } });

    if (hana && epson) {
      await prisma.damageReport.create({
        data: {
          userId: hana.id,
          resourceId: epson.id,
          description: 'Projector displays distorted colors and overheats after 30 minutes of use. Lamp may need replacement.',
          location: 'Conference Room A',
          status: 'PENDING'
        }
      });
    }
    if (hana && hp) {
      await prisma.damageReport.create({
        data: {
          userId: hana.id,
          resourceId: hp.id,
          description: 'Laptop battery does not hold charge and keyboard has multiple non-responsive keys.',
          location: 'Library Computer Lab',
          status: 'PENDING'
        }
      });
    }
    console.log('✅ Sample damage reports seeded');
  }

  // ─── Sample Requests ──────────────────────────────────────────────────────
  const reqCount = await prisma.request.count();
  if (reqCount === 0) {
    const abel = await prisma.user.findUnique({ where: { email: 'abel@uog.edu.et' } });
    const selam = await prisma.user.findUnique({ where: { email: 'selam@uog.edu.et' } });

    if (abel) {
      await prisma.request.create({
        data: {
          userId: abel.id,
          type: 'NEW_RESOURCE',
          description: 'Need a high-performance workstation for machine learning research projects',
          resourceName: 'Dell Precision 5820 Workstation',
          resourceType: 'ELECTRONICS',
          urgency: 'HIGH',
          reason: 'Current laptops cannot handle deep learning model training. This is critical for ongoing MSc thesis research.',
          status: 'PENDING'
        }
      });
    }
    if (selam) {
      await prisma.request.create({
        data: {
          userId: selam.id,
          type: 'NEW_RESOURCE',
          description: 'Requesting 3D printer for engineering prototyping lab',
          resourceName: 'Ultimaker S5 3D Printer',
          resourceType: 'LAB_EQUIPMENT',
          urgency: 'MEDIUM',
          reason: 'Engineering students need to fabricate prototypes for their capstone projects.',
          status: 'PENDING'
        }
      });
    }
    console.log('✅ Sample requests seeded');
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📋 Login credentials (all use password: Admin@1234)');
  console.log('═'.repeat(60));
  console.log('   admin@uog.edu.et       → ADMIN');
  console.log('   dean@uog.edu.et        → ACADEMIC_DEAN');
  console.log('   head@uog.edu.et        → DEPARTMENT_HEAD (CS)');
  console.log('   head2@uog.edu.et       → DEPARTMENT_HEAD (Eng)');
  console.log('   officer@uog.edu.et     → RESOURCE_OFFICER');
  console.log('   tech@uog.edu.et        → TECHNICIAN');
  console.log('   tech2@uog.edu.et       → TECHNICIAN');
  console.log('   hana@uog.edu.et        → STAFF (CS)');
  console.log('   abel@uog.edu.et        → STAFF (CS)');
  console.log('   selam@uog.edu.et       → STAFF (Eng)');
  console.log('═'.repeat(60));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
