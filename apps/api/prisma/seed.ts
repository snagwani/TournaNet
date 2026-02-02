import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2] || 'admin@tournanet.app';
    const password = process.argv[3] || 'admin123';

    console.log(`Creating admin user: ${email}`);

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
            role: UserRole.ADMIN,
        },
        create: {
            email,
            passwordHash,
            role: UserRole.ADMIN,
        },
    });

    console.log('✅ Admin user created successfully:', user.id);
    console.log('Credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
