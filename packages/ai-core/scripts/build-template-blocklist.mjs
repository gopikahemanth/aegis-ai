import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");

const targetFiles = [];

// 1. experience-generators/*.ts
const generatorsDir = path.join(packageRoot, "src", "design", "experience-generators");
if (fs.existsSync(generatorsDir)) {
  for (const file of fs.readdirSync(generatorsDir)) {
    if (file.endsWith(".ts") && !file.endsWith(".d.ts")) {
      targetFiles.push(path.join(generatorsDir, file));
    }
  }
}

// 2. candidate-composition-synthesizer.ts
const synthesizerPath = path.join(packageRoot, "src", "design", "candidate-composition-synthesizer.ts");
if (fs.existsSync(synthesizerPath)) {
  targetFiles.push(synthesizerPath);
}

// 3. page-experience-plan.ts
const pagePlanPath = path.join(packageRoot, "src", "design", "page-experience-plan.ts");
if (fs.existsSync(pagePlanPath)) {
  targetFiles.push(pagePlanPath);
}

const tailwindPrefixes = [
  "bg-", "text-", "font-", "p-", "px-", "py-", "pt-", "pb-", "pl-", "pr-",
  "m-", "mx-", "my-", "mt-", "mb-", "ml-", "mr-",
  "flex-", "grid-", "col-", "row-", "items-", "justify-", "self-",
  "border-", "rounded-", "shadow-", "w-", "h-", "min-w-", "max-w-", "min-h-", "max-h-",
  "gap-", "space-", "overflow-", "cursor-", "transition-", "duration-", "ease-",
  "hover:", "focus:", "active:", "disabled:", "dark:", "group-", "peer-", "animate-",
  "z-", "inset-", "top-", "bottom-", "left-", "right-", "opacity-"
];

function isTailwindOrCssClass(str) {
  const tokens = str.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  let cssTokenCount = 0;
  for (const t of tokens) {
    if (
      tailwindPrefixes.some(p => t.startsWith(p)) ||
      ["flex", "grid", "hidden", "block", "inline", "inline-block", "relative", "absolute", "fixed", "sticky"].includes(t)
    ) {
      cssTokenCount++;
    }
  }
  return cssTokenCount >= tokens.length * 0.5;
}

function shouldFilterOut(str, node) {
  const trimmed = str.trim();
  if (!trimmed) return true;

  // Check AST parent: import/export declaration
  let parent = node.parent;
  while (parent) {
    if (
      ts.isImportDeclaration(parent) ||
      ts.isExportDeclaration(parent) ||
      ts.isExternalModuleReference(parent)
    ) {
      return true;
    }
    parent = parent.parent;
  }

  // File paths or module specifiers
  if (/^(\.{1,2}\/|@\/|node:|\/)/.test(trimmed)) return true;
  if (/\.(ts|tsx|js|jsx|css|json|svg|png|jpg|jpeg|gif|webp|woff|woff2|ico)$/i.test(trimmed)) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;

  // Code snippets or tags
  if (/[{}();<>=`]/.test(trimmed)) return true;
  if (trimmed.includes("\n") || trimmed.includes("\r")) return true;
  if (trimmed.startsWith("#")) return true; // colors or hash IDs

  // CSS values
  if (/^(rgb|rgba|hsl|hsla|calc|minmax|var)\(/i.test(trimmed)) return true;
  if (/^(\d+(\.\d+)?(px|rem|em|%|vh|vw|fr|s|ms)\s*)+$/i.test(trimmed)) return true;

  // Tailwind class lists
  if (isTailwindOrCssClass(trimmed)) return true;

  // Single word without spaces or snake_case enum values
  if (trimmed.includes("_")) return true;
  if (!trimmed.includes(" ")) return true;

  // Generic UI, telemetry statuses, scene layers, and audio console elements
  const genericUiPatterns = [
    /^(optimal baseline|nominal range|within target bounds|verified stable|active stability)$/i,
    /^(configuration packet saved|export timestamped snapshot)$/i,
    /^calibrates target/i,
    /^adjusts threshold to balance/i,
    /^prevents operational oscillation/i,
    /procedure completed nominal/i,
    /optimized within bounds/i,
    /^atmospheric (environment|lighting|particles|void)$/i,
    /^(floating hud & interface dock|interactive system mesh|journey hud & compass|topological relief mesh|compass & landmark radar)$/i,
    /^(camera waypoints|clipping planes|schematics hotspots|telemetry hud)$/i,
    /^(spatial world exploration|cinematic living journey|topological spatial atlas)$/i,
    /^(acoustic & resonance console|tactile audio synthesis studio|master resonance gain|reverb decay envelope)$/i,
    /tap tactical pads to synthesize real-time harmonic frequencies calibrated to this domain/i,
    /^(high-freq sonar ping|deep hydrophone hum|pelagic leviathan call|thermal vent rumble|bioluminescent shimmer|hadal pressure echo)$/i,
    /^(acoustic bathymetric depth sounder echo|sub-surface tectonic pressure resonance|low-frequency communication across 100 nautical miles|superheated mineral expulsion from hydrothermal chimneys|high-order harmonic chime from siphonophore photophores|deepest benthic reverberation from 11,000 meters)$/i,
    /^(curator introduction|artist voice: the monolith|gallery 01: north atrium|gallery 02: light & void|gallery 03: tactile bronze|exhibition walkthrough outro)$/i,
    /^(stardust chime|misty flute|moss drum|cloud bell|acorn pop|whisper breeze)$/i,
    /^(sunlight xylophone|rainbow glockenspiel|bubble bass|playful brass horn|rhythm woodblock|fairy harp gliss)$/i,
    /^(harmonic ingress|sub-octave resonance|meridian bell|tactile pulse|atmospheric flute|high horizon chime)$/i,
  ];

  if (genericUiPatterns.some(pattern => pattern.test(trimmed))) {
    return true;
  }

  if (/\b(Drawer|Slide-over|Dialog|Modal|Button|Controls|Viewer|Plinth|Stage|Canvas|Mesh|Dropdown|Tooltip|Breadcrumb|Navbar|Header|Footer)$/i.test(trimmed)) {
    return true;
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const has3Words = words.length >= 3;
  const has12Chars = trimmed.length >= 12;

  if (!has3Words && !has12Chars) return true;

  return false;
}

const phrases = new Set();

for (const filePath of targetFiles) {
  const sourceCode = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const text = node.text.trim();
      if (!shouldFilterOut(text, node)) {
        phrases.add(text);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

const hardFlaggedPhrases = [
  "Day 21",
  "Practical Execution",
  "Grid Stability Index",
  "Renewable",
  "Avionics Flight Deck",
  "Telemetry & Operations Console",
];

for (const phrase of hardFlaggedPhrases) {
  phrases.add(phrase);
}

const sortedList = Array.from(phrases).sort((a, b) => a.localeCompare(b));

const outputPath = path.join(packageRoot, "src", "validation", "template-blocklist.generated.json");
fs.writeFileSync(outputPath, JSON.stringify(sortedList, null, 2), "utf8");
const distDir = path.join(packageRoot, "dist", "validation");
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, "template-blocklist.generated.json"), JSON.stringify(sortedList, null, 2), "utf8");
}
console.log(`[build-template-blocklist] Successfully wrote ${sortedList.length} template phrases to ${outputPath}`);
