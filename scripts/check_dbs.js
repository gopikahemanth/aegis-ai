import { PrismaClient } from './projects/orbitalis-research-center-test/node_modules/@prisma/client/default.js';

async function main() {
  const prisma = new PrismaClient({
    datasourceUrl: 'postgresql://postgres:postgres@localhost:5432/app_db?schema=public'
  });
  const dbs = await prisma.$queryRawUnsafe('SELECT datname FROM pg_database WHERE datistemplate = false;');
  console.log('DATABASES:', dbs);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
