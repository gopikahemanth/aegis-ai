const fs = require('fs');
const path = require('path');
const { GenericExperienceGenerator } = require('../packages/ai-core/dist/design/experience-generators/generic-experience-generator.js');

const KAZZOO_PAGES = path.resolve(__dirname, '../projects/kazzoo-a/src/pages');

// 1. Family Adventures Page - Cinematic / Center-stage scroll
const familyCode = GenericExperienceGenerator.generate({
  componentName: "FamilyAdventuresPage",
  brandName: "Kazzoo",
  route: "/family-adventures",
  pageRole: "Family Island Expedition",
  purpose: "Cinematic visual adventures across the cloud spires",
  prompt: "Playful children fantasy archipelago story with visual chapters",
  seed: 14,
  experienceCapability: "SCROLL_STORY"
});
fs.writeFileSync(path.join(KAZZOO_PAGES, 'FamilyAdventuresPage.tsx'), familyCode);

// 2. Print Journey Scroll Page - Horizontal parchment scroll
const printCode = GenericExperienceGenerator.generate({
  componentName: "PrintJourneyScrollPage",
  brandName: "Kazzoo",
  route: "/print-journey-scroll",
  pageRole: "Print Journey Scroll",
  purpose: "Horizontal parchment journey scroll and timeline",
  prompt: "Horizontal keepsake story scroll and musical timeline",
  seed: 28,
  experienceCapability: "SCROLL_STORY"
});
fs.writeFileSync(path.join(KAZZOO_PAGES, 'PrintJourneyScrollPage.tsx'), printCode);

console.log("Updated Kazzoo pages successfully!");
