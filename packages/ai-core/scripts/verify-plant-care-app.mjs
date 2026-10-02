import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

async function verifyPlantCareApp() {
  console.log("Starting Comprehensive Chromium Audit of Plant-Care Companion App...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("favicon")) {
      console.log(`HTTP ${res.status()}: ${res.url()}`);
    }
  });

  const artifactsDir = "C:/Users/vishn/.gemini/antigravity-ide/brain/c314194d-355d-44dc-a2ea-ca54806e9f09";

  const targetRoutes = [
    { name: "Watering Schedules (Root)", path: "/" },
    { name: "Plant Sanctuary Dashboard", path: "/dashboard" },
    { name: "Growth Photos Journal", path: "/growth-photos" },
    { name: "Sunlight Requirements", path: "/sunlight-needs" },
  ];

  const routeAudits = [];

  for (const route of targetRoutes) {
    console.log(`\n======================================================`);
    console.log(`Auditing Route: ${route.name} (${route.path})`);
    console.log(`======================================================`);

    await page.goto(`http://localhost:5173${route.path}`, { waitUntil: "networkidle0", timeout: 15000 });
    await new Promise(r => setTimeout(r, 600));

    const audit = await page.evaluate(() => {
      // 1. Color Audit
      const bodyStyle = window.getComputedStyle(document.body);
      const allButtons = Array.from(document.querySelectorAll("button, a.btn, a[class*='btn']"));
      const buttonStyles = allButtons.map(b => {
        const cs = window.getComputedStyle(b);
        return {
          text: b.innerText.trim().replace(/\n/g, " "),
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.borderColor,
          borderRadius: cs.borderRadius
        };
      });

      // Check for amber/mustard: rgb(212, 160, 23) or hex #d4a017
      const hasAmberButtons = buttonStyles.some(b => 
        b.bg.includes("212, 160, 23") || b.bg.includes("212, 160") || b.border.includes("212, 160, 23")
      );

      // Check for terracotta primary buttons: rgb(196, 115, 74) or hover rgb(168, 92, 55)
      const terracottaButtons = buttonStyles.filter(b =>
        b.bg.includes("196, 115, 74") || b.bg.includes("168, 92, 55") || b.bg.includes("196, 115")
      );

      // Active nav pill
      const navLinks = Array.from(document.querySelectorAll("header nav a, nav a"));
      const navStyles = navLinks.map(a => {
        const cs = window.getComputedStyle(a);
        return {
          text: a.innerText.trim(),
          href: a.getAttribute("href"),
          bg: cs.backgroundColor,
          color: cs.color
        };
      });

      const activeNavPill = navStyles.find(a => 
        a.bg.includes("91, 127, 110") || a.bg.includes("5b7f6e") || a.bg !== "rgba(0, 0, 0, 0)"
      );

      // 2. Images Audit (especially for growth photos)
      const images = Array.from(document.querySelectorAll("img")).map(img => ({
        src: img.src,
        alt: img.alt,
        renderedWidth: img.naturalWidth || img.clientWidth,
        renderedHeight: img.naturalHeight || img.clientHeight
      }));

      // Check for empty camera placeholder divs
      const emptyCameraHolders = Array.from(document.querySelectorAll("div.bg-slate-800, div.bg-gray-800, div[class*='bg-gray']"))
        .filter(d => d.querySelector("svg") && !d.querySelector("img")).length;

      // 3. Layout Structure
      const h1 = document.querySelector("h1")?.innerText?.trim() || "";
      const h2s = Array.from(document.querySelectorAll("h2")).map(h => h.innerText.trim()).filter(Boolean);
      const cards = document.querySelectorAll("div[class*='rounded'], div[class*='card']").length;

      return {
        bodyBg: bodyStyle.backgroundColor,
        bodyFont: bodyStyle.fontFamily,
        buttonCount: buttonStyles.length,
        terracottaButtonCount: terracottaButtons.length,
        terracottaButtonSamples: terracottaButtons.map(b => `${b.text} (${b.bg})`).slice(0, 5),
        hasAmberButtons,
        amberButtonCount: buttonStyles.filter(b => b.bg.includes("212, 160")).length,
        activeNavPill,
        imageCount: images.length,
        realImages: images.filter(img => img.src.startsWith("http")).map(img => img.src.slice(0, 70)),
        emptyCameraHolders,
        h1,
        h2s: h2s.slice(0, 5),
        cardsCount: cards
      };
    });

    const safeSlug = route.path === "/" ? "root_watering" : route.path.replace(/[^a-zA-Z0-9]/g, "_");
    const screenshotFile = `botanical_audit_${safeSlug}.png`;
    const screenshotPath = path.join(artifactsDir, screenshotFile);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    audit.route = route.path;
    audit.routeName = route.name;
    audit.screenshotPath = screenshotPath;
    routeAudits.push(audit);

    console.log(`H1: "${audit.h1}"`);
    console.log(`Body Background: ${audit.bodyBg}`);
    console.log(`Active Nav Pill: ${audit.activeNavPill?.text} -> bg: ${audit.activeNavPill?.bg}`);
    console.log(`Terracotta Buttons: ${audit.terracottaButtonCount} found. Samples: ${audit.terracottaButtonSamples.join(", ")}`);
    console.log(`Amber Buttons Detected: ${audit.hasAmberButtons} (${audit.amberButtonCount})`);
    console.log(`Images: ${audit.imageCount} (Real URLs: ${audit.realImages.length})`);
    console.log(`Saved screenshot: ${screenshotFile}`);
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    totalRoutesAudited: routeAudits.length,
    zeroAmberGoldAchieved: routeAudits.every(r => !r.hasAmberButtons),
    terracottaActive: routeAudits.some(r => r.terracottaButtonCount > 0),
    sageNavActive: routeAudits.every(r => r.activeNavPill?.bg?.includes("91, 127, 110") || r.activeNavPill?.bg?.includes("5b7f6e")),
    routes: routeAudits
  };

  fs.writeFileSync(
    path.join(artifactsDir, "botanical_audit_report.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log("\n================ AUDIT SUMMARY ================");
  console.log(`Zero Amber/Mustard Gold: ${report.zeroAmberGoldAchieved ? "PASSED ✅" : "FAILED ❌"}`);
  console.log(`Terracotta Clay Primary CTAs: ${report.terracottaActive ? "PASSED ✅" : "FAILED ❌"}`);
  console.log(`Sage Green Active Nav: ${report.sageNavActive ? "PASSED ✅" : "FAILED ❌"}`);

  if (!report.zeroAmberGoldAchieved) {
    console.error("FAIL: Amber gold buttons detected on page!");
    process.exit(1);
  }
}

verifyPlantCareApp().catch(err => {
  console.error("Audit script failed:", err);
  process.exit(1);
});
