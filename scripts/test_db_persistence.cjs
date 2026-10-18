const fs = require('fs');
const path = require('path');
const targetDir = path.resolve(process.argv[2] || 'C:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/projects/aegis-verification-run-20261013-222018');
const prismaClientPkg = fs.existsSync(path.join(targetDir, 'node_modules', '@prisma/client'))
  ? path.join(targetDir, 'node_modules', '@prisma/client')
  : require.resolve('@prisma/client', { paths: [path.join(__dirname, '../packages/ai-core'), path.join(__dirname, '../projects/aegis-verification-run-20261013-222018')] });
const { PrismaClient } = require(prismaClientPkg);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:postgres@localhost:5432/app_db?schema=public"
    }
  }
});

async function testPersistence() {
  console.log('Testing PostgreSQL connection...');
  try {
    const userCount = await prisma.user.count();
    const assetCount = await prisma.asset.count();
    console.log('✅ Connected to PostgreSQL! Current counts:', { userCount, assetCount });

    // Step 1: Create a uniquely identifiable user and asset
    const testEmail = `operator_${Date.now()}@greenpulse.io`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'hash_test_123'
      }
    });
    console.log('✅ Created User:', { id: user.id, email: user.email });

    const assetUniqueName = `Solara-Alpha-Turbine-${Date.now()}`;
    const asset = await prisma.asset.create({
      data: {
        userId: user.id,
        name: assetUniqueName,
        content: JSON.stringify({ type: 'Solar/Wind Hybrid', capacity: '150 MW', status: 'Online' })
      }
    });
    console.log('✅ Created Asset:', { id: asset.id, name: asset.name });

    // Step 2: Read it back independently through Prisma query
    const readBack = await prisma.asset.findUnique({
      where: { id: asset.id }
    });
    console.log('✅ Read-back Asset from PostgreSQL:', { id: readBack.id, name: readBack.name, createdAt: readBack.createdAt });

    if (readBack.name === assetUniqueName) {
      console.log('🎉 Full database write + independent read-back cycle VERIFIED in PostgreSQL!');
      const evidence = {
        timestamp: new Date().toISOString(),
        testSuite: "Suite 1: Database Persistence Verification",
        database: "PostgreSQL (localhost:5432/app_db)",
        status: "PASS",
        user: { id: user.id, email: user.email },
        createdAsset: { id: asset.id, name: asset.name },
        readBackAsset: { id: readBack.id, name: readBack.name, createdAt: readBack.createdAt },
        verification: "Direct PostgreSQL mutation and independent Prisma read-back confirmed"
      };
      const evidenceFile = path.join(targetDir, '.aegis', 'api-workflow-evidence.json');
      fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2), 'utf8');
      console.log('📄 Saved persistence evidence to:', evidenceFile);
    } else {
      console.error('❌ Read-back name mismatch!');
    }
  } catch (err) {
    console.error('❌ PostgreSQL Persistence Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPersistence();
