const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
const cliPath = path.resolve(repoRoot, 'apps/cli/dist/index.js');

const PROJECTS_TO_GENERATE = [
  {
    id: 'velora-living-v2',
    name: 'Velora Living (Furniture E-Commerce)',
    targetDir: 'projects/fresh-v2-ecommerce-furniture-20261015',
    prompt: `Build a premium furniture store and e-commerce website named VELORA LIVING. Create a distinctive, high-end interior furnishings retail platform featuring product listings, material and category filters, interactive product details with dimension specs, and a functional shopping cart with order summary. Requirements: - Use the existing Aegis AI frontend-first generation pipeline. - Clean, premium visual design with rich typography, generous whitespace, and elegant color palette. - Responsive layouts across desktop, tablet, and mobile. - Distinctive product gallery, interactive cart drawer/page, and item details. - Zero duplicate navigation shells and zero cross-route layout cloning. - All routes must render real data, handle interactive events, and avoid empty states.`
  },
  {
    id: 'savoria-kitchen-v2',
    name: 'Savoria Kitchen (Restaurant Food Ordering & Menu)',
    targetDir: 'projects/fresh-v2-restaurant-ordering-20261015',
    prompt: `Build a modern food ordering and table reservation website named SAVORIA KITCHEN. Create an enticing, high-end culinary ordering platform featuring categorized menus (Appetizers, Chef's Specials, Main Courses, Desserts, Artisan Beverages), dietary filter tags (Gluten-Free, Vegan, Halal), interactive dish details with allergen information, a dynamic cart drawer with quantity increments, special instructions input, order checkout with delivery/pickup selection, and order history persistence. Requirements: - Warm, appetite-inducing premium visual design with rich food imagery, elegant typography, and generous spacing. - Responsive layouts across desktop, tablet, and mobile. - Interactive cart with live subtotal, tax, delivery fee calculation, and promo code support. - Zero duplicate navigation shells and zero cross-route layout cloning. - All routes must render real data, handle interactive events, and avoid empty states.`
  },
  {
    id: 'aura-health-v2',
    name: 'Aura Health (Healthcare Appointment Booking)',
    targetDir: 'projects/fresh-v2-healthcare-booking-20261015',
    prompt: `Build a healthcare appointment booking platform named AURA HEALTH. Create a patient-centric medical scheduling platform featuring provider listings, clinic availability calendars, interactive booking forms with time slot selection, and patient appointment management. Requirements: - Calm, accessible healthcare visual language with doctor credentials, specialty filters, and appointment status tags. - Responsive layouts across desktop, tablet, and mobile. - Interactive booking flow with date/time pickers and confirmation dialogs. - Zero duplicate navigation shells and zero cross-route layout cloning. - All routes must render real data, handle interactive events, and avoid empty states.`
  }
];

const targetArg = process.argv[2];
const targets = targetArg ? PROJECTS_TO_GENERATE.filter(p => p.id.includes(targetArg) || p.targetDir.includes(targetArg)) : PROJECTS_TO_GENERATE;

console.log(`================================================================`);
console.log(`AEGIS AI — GENERATING ${targets.length} CORRECTED PROJECTS WITH FIXED FRAMEWORK`);
console.log(`================================================================\n`);

for (const t of targets) {
  console.log(`\n----------------------------------------------------------------`);
  console.log(`🚀 GENERATING: ${t.name}`);
  console.log(`   Target Directory: ${t.targetDir}`);
  console.log(`----------------------------------------------------------------\n`);

  const start = Date.now();
  try {
    execSync(`node "${cliPath}" create "${t.prompt}" -o "${t.targetDir}" -y --fresh`, {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env
    });
    const dur = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n  ✅ SUCCESS: ${t.name} generated cleanly in ${dur}s.`);
  } catch (err) {
    const dur = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`\n  ❌ FAILED: ${t.name} generation error after ${dur}s:`, err.message);
  }
}
