import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    const email = `test-${Date.now()}@example.com`;
    const password = 'Password123!';
    const hashedPassword = await argon2.hash(password);

    console.log(`Attempting to create user: ${email}`);

    try {
        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                role: Role.USER,
                currency: 'AED',
                isActive: true,
                isDeleted: false,
                forceChangePassword: true,
            },
        });
        console.log('User created successfully:', newUser.id);
    } catch (error) {
        console.error('Error creating user:', error);
    }

    process.exit(0);
}

main();
