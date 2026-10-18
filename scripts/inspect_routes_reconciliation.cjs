const fs = require('fs');
const path = require('path');

const projects = [
  'projects/fresh-ecommerce-furniture-20261015',
  'projects/fresh-education-lms-20261015',
  'projects/fresh-healthcare-booking-20261015',
  'projects/fresh-creative-portfolio-20261015'
];

for (const p of projects) {
  console.log('================================================================');
  console.log('PROJECT:', p);
  
  // 1. Contract required routes
  const repPath = path.join(p, '.aegis/execution-report.json');
  let contractRoutes = [];
  if (fs.existsSync(repPath)) {
    const rep = JSON.parse(fs.readFileSync(repPath, 'utf8'));
    contractRoutes = rep.architectureContract?.requiredRoutes || [];
  }
  console.log('1. Contract Required Routes (' + contractRoutes.length + '):', contractRoutes);

  // 2. routes.tsx actual declared routes
  const routesFile = path.join(p, 'src/routes.tsx');
  let declaredRoutes = [];
  if (fs.existsSync(routesFile)) {
    const content = fs.readFileSync(routesFile, 'utf8');
    const regex = /path=['"]([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      declaredRoutes.push(match[1]);
    }
    declaredRoutes = [...new Set(declaredRoutes)];
  }
  console.log('2. routes.tsx Declared Routes (' + declaredRoutes.length + '):', declaredRoutes);

  // 3. Pages on disk
  const pagesDir = path.join(p, 'src/pages');
  let pageFiles = [];
  if (fs.existsSync(pagesDir)) {
    pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));
  }
  console.log('3. Pages on disk (' + pageFiles.length + '):', pageFiles);

  // 4. Evidence file routes audited by run_fresh_website_generations.cjs
  const evFile = path.join(p, '.aegis/fresh-generation-verification-evidence.json');
  if (fs.existsSync(evFile)) {
    const ev = JSON.parse(fs.readFileSync(evFile, 'utf8'));
    console.log('4. Post-Gen Evidence Checked Routes (' + ev.routes.length + '):', ev.routes.map(r => r.route));
  }
}
