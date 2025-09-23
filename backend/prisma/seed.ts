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

  // Create audit event for admin creation
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

  console.log('✅ Database seed completed successfully!');
  console.log(`\n📋 Admin Login Credentials:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`\n⚠️  Please change the admin password after first login!`);
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
