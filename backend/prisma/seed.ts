import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aas.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin user created: ${adminUser.email} (ID: ${adminUser.id})`);

  // Create some sample tags
  const tags = [
    { name: 'Mathematics', color: '#3B82F6' },
    { name: 'Physics', color: '#10B981' },
    { name: 'Chemistry', color: '#F59E0B' },
    { name: 'Biology', color: '#EF4444' },
    { name: 'Computer Science', color: '#8B5CF6' },
    { name: 'Important', color: '#EC4899' },
    { name: 'Review', color: '#F97316' },
  ];

  for (const tagData of tags) {
    await prisma.tag.upsert({
      where: { name: tagData.name },
      update: {},
      create: tagData,
    });
  }

  console.log(`✅ Created ${tags.length} sample tags`);

  // Create a demo user for testing
  const demoPassword = 'demo123';
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@aas.com' },
    update: {},
    create: {
      email: 'demo@aas.com',
      password: await bcrypt.hash(demoPassword, 12),
      name: 'Demo User',
      role: 'USER',
    },
  });

  console.log(`✅ Demo user created: ${demoUser.email} (ID: ${demoUser.id})`);

  // Create sample folders for demo user
  const foldersData = [
    { name: 'AP Physics', color: '#3B82F6', userId: demoUser.id },
    { name: 'AP Chemistry', color: '#F59E0B', userId: demoUser.id },
    { name: 'AP Calculus', color: '#10B981', userId: demoUser.id },
    { name: 'Practice Problems', color: '#EC4899', userId: demoUser.id },
  ];

  const folders = [];
  for (const folderData of foldersData) {
    const folder = await prisma.folder.upsert({
      where: {
        name_userId: {
          name: folderData.name,
          userId: folderData.userId,
        },
      },
      update: {},
      create: folderData,
    });
    folders.push(folder);
  }

  console.log(`✅ Created ${folders.length} sample folders`);

  // Create sample problems
  const problemsData = [
    {
      title: 'Projectile Motion - Baseball Problem',
      description: 'A baseball is hit at an angle of 45° with an initial velocity of 30 m/s. Calculate the maximum height and range.',
      subject: 'ap_physics_1_2',
      difficulty: 'medium',
      userId: demoUser.id,
    },
    {
      title: 'Chemical Equilibrium - Le Chatelier\'s Principle',
      description: 'For the reaction N2(g) + 3H2(g) ⇌ 2NH3(g), explain how increasing pressure affects the equilibrium.',
      subject: 'ap_chemistry',
      difficulty: 'medium',
      userId: demoUser.id,
    },
    {
      title: 'Integration by Parts',
      description: 'Evaluate the integral: ∫ x·e^x dx',
      subject: 'ap_calculus_bc',
      difficulty: 'hard',
      userId: demoUser.id,
    },
  ];

  const problems = [];
  for (const problemData of problemsData) {
    const problem = await prisma.problem.create({
      data: problemData,
    });
    problems.push(problem);
  }

  console.log(`✅ Created ${problems.length} sample problems`);

  // Create sample solutions for the first problem
  if (problems.length > 0) {
    const solution = await prisma.solution.create({
      data: {
        problemId: problems[0].id,
        steps: [
          {
            id: 1,
            title: 'Identify Given Information',
            content: 'Initial velocity v₀ = 30 m/s, Launch angle θ = 45°, g = 9.8 m/s²',
            explanation: 'Extract the known values from the problem statement',
          },
          {
            id: 2,
            title: 'Calculate Vertical Component',
            content: 'v₀y = v₀·sin(θ) = 30·sin(45°) = 21.2 m/s',
            explanation: 'Use trigonometry to find the vertical component of initial velocity',
          },
          {
            id: 3,
            title: 'Find Maximum Height',
            content: 'h_max = (v₀y)²/(2g) = (21.2)²/(2×9.8) = 22.9 m',
            explanation: 'At maximum height, vertical velocity becomes zero',
          },
          {
            id: 4,
            title: 'Calculate Range',
            content: 'R = (v₀²·sin(2θ))/g = (30²·sin(90°))/9.8 = 91.8 m',
            explanation: 'Use range formula for projectile motion',
          },
        ],
        finalAnswer: 'Maximum height: 22.9 m, Range: 91.8 m',
        confidence: 0.95,
      },
    });

    console.log(`✅ Created sample solution for problem: ${problems[0].title}`);
  }

  // Create sample notes
  if (problems.length > 0 && folders.length > 0) {
    const note = await prisma.note.create({
      data: {
        title: 'Projectile Motion Key Concepts',
        content: 'Important formulas:\n\n1. v₀y = v₀·sin(θ)\n2. v₀x = v₀·cos(θ)\n3. h_max = (v₀y)²/(2g)\n4. Range = (v₀²·sin(2θ))/g\n5. Time of flight = 2v₀y/g',
        type: 'CONCEPT',
        subject: 'ap_physics_1_2',
        folderId: folders[0].id,
        userId: demoUser.id,
      },
    });

    console.log(`✅ Created sample note: ${note.title}`);
  }

  // Create audit events
  await prisma.event.create({
    data: {
      type: 'AUTH_REGISTER',
      userId: adminUser.id,
      data: {
        role: 'ADMIN',
        seeded: true,
      },
    },
  });

  await prisma.event.create({
    data: {
      type: 'AUTH_REGISTER',
      userId: demoUser.id,
      data: {
        role: 'USER',
        seeded: true,
      },
    },
  });

  console.log('✅ Database seed completed successfully!');
  console.log(`\n📋 Login Credentials:\n`);
  console.log(`👤 Admin User:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}\n`);
  console.log(`👤 Demo User:`);
  console.log(`   Email: demo@aas.com`);
  console.log(`   Password: demo123\n`);
  console.log(`⚠️  Please change passwords after first login!`);
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
