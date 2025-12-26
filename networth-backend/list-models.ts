import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const props = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
    console.log('--- Models in Prisma Client ---');
    console.log(props.sort().join(', '));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
