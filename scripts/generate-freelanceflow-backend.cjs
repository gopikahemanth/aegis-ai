const fs = require('fs');
const path = require('path');
const { DynamicApiGenerator } = require('../packages/ai-core/dist/backend/dynamic-api-generator.js');

const targetDir = path.resolve(__dirname, '../../generated/phase-e2-freelanceflow');

const contract = {
  version: 2,
  contractHash: 'freelanceflow_phase_e2_contract',
  projectName: 'FreelanceFlow',
  domainCategory: 'FREELANCE_BUSINESS_MANAGEMENT',
  frontend: { framework: 'react-vite', buildTool: 'vite', styling: 'tailwind', stateManagement: 'zustand', port: 5173 },
  backend: { runtime: 'node', framework: 'express', apiType: 'REST', port: 5000, corsOrigin: '*' },
  database: { orm: 'prisma', engine: 'sqlite', schemaPath: 'prisma/schema.prisma' },
  routes: { frontendRoutes: [], backendEndpoints: [] },
  dataModels: {
    models: [
      {
        name: 'User',
        fields: [
          { name: 'id', type: 'String', constraints: '@id @default(uuid())' },
          { name: 'email', type: 'String', constraints: '@unique' },
          { name: 'password', type: 'String' },
          { name: 'name', type: 'String' },
          { name: 'role', type: 'String', constraints: '@default("user")' },
          { name: 'createdAt', type: 'DateTime', constraints: '@default(now())' },
          { name: 'updatedAt', type: 'DateTime', constraints: '@updatedAt' }
        ],
        relations: []
      },
      {
        name: 'Client',
        fields: [
          { name: 'id', type: 'String', constraints: '@id @default(uuid())' },
          { name: 'userId', type: 'String', constraints: '@default("")' },
          { name: 'name', type: 'String' },
          { name: 'email', type: 'String' },
          { name: 'company', type: 'String', constraints: '@default("")' },
          { name: 'status', type: 'String', constraints: '@default("ACTIVE")' },
          { name: 'phone', type: 'String', constraints: '@default("")' },
          { name: 'notes', type: 'String', constraints: '@default("")' },
          { name: 'createdAt', type: 'DateTime', constraints: '@default(now())' },
          { name: 'updatedAt', type: 'DateTime', constraints: '@updatedAt' }
        ],
        relations: []
      },
      {
        name: 'Project',
        fields: [
          { name: 'id', type: 'String', constraints: '@id @default(uuid())' },
          { name: 'userId', type: 'String', constraints: '@default("")' },
          { name: 'clientId', type: 'String' },
          { name: 'name', type: 'String' },
          { name: 'description', type: 'String', constraints: '@default("")' },
          { name: 'budget', type: 'Float', constraints: '@default(0.0)' },
          { name: 'status', type: 'String', constraints: '@default("IN_PROGRESS")' },
          { name: 'progress', type: 'Int', constraints: '@default(0)' },
          { name: 'deadline', type: 'String', constraints: '@default("")' },
          { name: 'createdAt', type: 'DateTime', constraints: '@default(now())' },
          { name: 'updatedAt', type: 'DateTime', constraints: '@updatedAt' }
        ],
        relations: []
      },
      {
        name: 'Task',
        fields: [
          { name: 'id', type: 'String', constraints: '@id @default(uuid())' },
          { name: 'projectId', type: 'String' },
          { name: 'title', type: 'String' },
          { name: 'status', type: 'String', constraints: '@default("TODO")' },
          { name: 'priority', type: 'String', constraints: '@default("MEDIUM")' },
          { name: 'dueDate', type: 'String', constraints: '@default("")' },
          { name: 'createdAt', type: 'DateTime', constraints: '@default(now())' },
          { name: 'updatedAt', type: 'DateTime', constraints: '@updatedAt' }
        ],
        relations: []
      },
      {
        name: 'Invoice',
        fields: [
          { name: 'id', type: 'String', constraints: '@id @default(uuid())' },
          { name: 'userId', type: 'String', constraints: '@default("")' },
          { name: 'clientId', type: 'String' },
          { name: 'invoiceNumber', type: 'String' },
          { name: 'subtotal', type: 'Float', constraints: '@default(0.0)' },
          { name: 'tax', type: 'Float', constraints: '@default(0.0)' },
          { name: 'discount', type: 'Float', constraints: '@default(0.0)' },
          { name: 'total', type: 'Float', constraints: '@default(0.0)' },
          { name: 'balanceDue', type: 'Float', constraints: '@default(0.0)' },
          { name: 'status', type: 'String', constraints: '@default("PENDING")' },
          { name: 'dueDate', type: 'String', constraints: '@default("")' },
          { name: 'notes', type: 'String', constraints: '@default("")' },
          { name: 'createdAt', type: 'DateTime', constraints: '@default(now())' },
          { name: 'updatedAt', type: 'DateTime', constraints: '@updatedAt' }
        ],
        relations: []
      },
      {
        name: 'InvoiceItem',
        fields: [
          { name: 'id', type: 'String', constraints: '@id @default(uuid())' },
          { name: 'invoiceId', type: 'String' },
          { name: 'description', type: 'String' },
          { name: 'quantity', type: 'Int', constraints: '@default(1)' },
          { name: 'unitPrice', type: 'Float', constraints: '@default(0.0)' },
          { name: 'amount', type: 'Float', constraints: '@default(0.0)' },
          { name: 'createdAt', type: 'DateTime', constraints: '@default(now())' },
          { name: 'updatedAt', type: 'DateTime', constraints: '@updatedAt' }
        ],
        relations: []
      },
      {
        name: 'Payment',
        fields: [
          { name: 'id', type: 'String', constraints: '@id @default(uuid())' },
          { name: 'invoiceId', type: 'String' },
          { name: 'userId', type: 'String', constraints: '@default("")' },
          { name: 'amount', type: 'Float' },
          { name: 'paymentMethod', type: 'String', constraints: '@default("BANK_TRANSFER")' },
          { name: 'reference', type: 'String', constraints: '@default("")' },
          { name: 'createdAt', type: 'DateTime', constraints: '@default(now())' },
          { name: 'updatedAt', type: 'DateTime', constraints: '@updatedAt' }
        ],
        relations: []
      }
    ]
  },
  directories: [],
  lockedAt: new Date().toISOString()
};

const backendFiles = DynamicApiGenerator.generateAll(contract);
const frontendFiles = DynamicApiGenerator.generateFrontendIntegration(contract);
const allFiles = [...backendFiles, ...frontendFiles];

console.log('Writing ' + allFiles.length + ' files to ' + targetDir);
for (const file of allFiles) {
  const fullPath = path.join(targetDir, file.path);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, file.content, 'utf8');
}

// Write .env with SQLite database URL
fs.writeFileSync(path.join(targetDir, '.env'), 'DATABASE_URL="file:./dev.db"\nPORT=5000\nNODE_ENV=development\nJWT_SECRET=super-secret-aegis-key-2026\n', 'utf8');

console.log('All FreelanceFlow backend and integration files successfully generated and written.');
