const fs = require('fs');
const path = require('path');
const { DynamicApiGenerator } = require('../packages/ai-core/dist/backend/dynamic-api-generator.js');

const targetDir = path.resolve(__dirname, '../../generated/phase-e-pawhaven');

const contract = {
  version: 2,
  contractHash: 'pawhaven_phase_e_contract',
  projectName: 'PawHaven',
  domainCategory: 'PET_CARE',
  frontend: { framework: 'react-vite', buildTool: 'vite', styling: 'tailwind', stateManagement: 'zustand', port: 5173 },
  backend: { runtime: 'node', framework: 'express', apiType: 'REST', port: 3001, corsOrigin: '*' },
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
        name: 'PetProfile',
        fields: [
          { name: 'id', type: 'String', constraints: '@id @default(uuid())' },
          { name: 'name', type: 'String' },
          { name: 'breed', type: 'String' },
          { name: 'age', type: 'Int', constraints: '@default(1)' },
          { name: 'notes', type: 'String', constraints: '@default("")' },
          { name: 'ownerId', type: 'String', constraints: '@default("")' },
          { name: 'createdAt', type: 'DateTime', constraints: '@default(now())' },
          { name: 'updatedAt', type: 'DateTime', constraints: '@updatedAt' }
        ],
        relations: []
      },
      {
        name: 'Service',
        fields: [
          { name: 'id', type: 'String', constraints: '@id @default(uuid())' },
          { name: 'name', type: 'String' },
          { name: 'description', type: 'String', constraints: '@default("")' },
          { name: 'price', type: 'Float', constraints: '@default(35.0)' },
          { name: 'durationMinutes', type: 'Int', constraints: '@default(60)' },
          { name: 'createdAt', type: 'DateTime', constraints: '@default(now())' },
          { name: 'updatedAt', type: 'DateTime', constraints: '@updatedAt' }
        ],
        relations: []
      },
      {
        name: 'Appointment',
        fields: [
          { name: 'id', type: 'String', constraints: '@id @default(uuid())' },
          { name: 'serviceName', type: 'String' },
          { name: 'petName', type: 'String' },
          { name: 'customerName', type: 'String' },
          { name: 'customerEmail', type: 'String' },
          { name: 'appointmentDate', type: 'String' },
          { name: 'startTime', type: 'String' },
          { name: 'endTime', type: 'String' },
          { name: 'status', type: 'String', constraints: '@default("CONFIRMED")' },
          { name: 'notes', type: 'String', constraints: '@default("")' },
          { name: 'createdAt', type: 'DateTime', constraints: '@default(now())' },
          { name: 'updatedAt', type: 'DateTime', constraints: '@updatedAt' }
        ],
        relations: []
      },
      {
        name: 'CareLog',
        fields: [
          { name: 'id', type: 'String', constraints: '@id @default(uuid())' },
          { name: 'petName', type: 'String' },
          { name: 'activity', type: 'String' },
          { name: 'notes', type: 'String', constraints: '@default("")' },
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
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, file.content, 'utf8');
}
console.log('All backend and integration files successfully generated and written.');
