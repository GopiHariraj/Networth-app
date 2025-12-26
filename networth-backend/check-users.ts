import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { isDeleted: false }
    });
    console.log('--- Current Users in DB ---');
    users.forEach(u => {
        console.log(`ID: ${u.id} | Email: ${u.email} | FirstName: "${u.firstName}" | LastName: "${u.lastName}" | Role: ${u.role}`);
    });
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
