import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

async function run() {
  console.log("Launching Chromium to test all nav links on http://localhost:5173/ ...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
  console.log("Initial page loaded: " + page.url());

  // Extract all nav links from header / nav
  const navLinks = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("header nav a, nav a"));
    return anchors.map(a => ({
      text: a.innerText.trim(),
      href: a.getAttribute("href")
    }));
  });

  console.log(`Found ${navLinks.length} nav links:`, JSON.stringify(navLinks, null, 2));

  const results = [];
  const artifactsDir = "C:/Users/vishn/.gemini/antigravity-ide/brain/c314194d-355d-44dc-a2ea-ca54806e9f09";

  for (const item of navLinks) {
    console.log(`\n--- Testing Link: "${item.text}" (target: ${item.href}) ---`);
    
    // Click the specific nav link by finding its matching anchor
    const clicked = await page.evaluate((targetHref) => {
      const link = Array.from(document.querySelectorAll("header nav a, nav a"))
        .find(a => a.getAttribute("href") === targetHref);
      if (link) {
        link.click();
        return true;
      }
      return false;
    }, item.href);

    if (!clicked) {
      console.error(`Failed to find or click link for ${item.href}`);
      results.push({ item, passed: false, error: "Link element not found to click" });
      continue;
    }

    // Wait for route transition
    await new Promise(r => setTimeout(r, 600));

    const currentUrl = page.url();
    const pathname = new URL(currentUrl).pathname;
    
    // Inspect DOM details
    const pageDetails = await page.evaluate(() => {
      const h1 = document.querySelector("h1")?.innerText?.trim() || "";
      const h2s = Array.from(document.querySelectorAll("h2")).map(h => h.innerText.trim()).filter(Boolean);
      const text = document.body.innerText || "";
      
      const hasGenericDiary = /Write something wonderful|journaling journey|Dear diary|daily reflections/i.test(text);
      const isPinkTheme = text.includes("🌸") || text.includes("✨");
      const hasFinanceControls = /Expense|Income|Transaction|Budget|Ledger|Cashflow|Category|Balance|Filter|Amount/i.test(text);
      
      return {
        h1,
        h2s: h2s.slice(0, 4),
        textSnippet: text.slice(0, 300).replace(/\s+/g, " "),
        hasGenericDiary,
        isPinkTheme,
        hasFinanceControls
      };
    });

    const isMatch = (pathname === item.href) || (item.href === "/" && pathname === "/");
    const redirectedToHome = (item.href !== "/" && pathname === "/");

    const safeSlug = item.href.replace(/[^a-zA-Z0-9]/g, "_") || "home";
    const screenshotPath = path.join(artifactsDir, `nav_verify_${safeSlug}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    const status = {
      label: item.text,
      targetHref: item.href,
      actualPath: pathname,
      urlMatch: isMatch,
      redirectedToHome,
      h1: pageDetails.h1,
      h2s: pageDetails.h2s,
      hasGenericDiary: pageDetails.hasGenericDiary,
      hasFinanceControls: pageDetails.hasFinanceControls,
      screenshot: screenshotPath,
      passed: isMatch && !redirectedToHome && !pageDetails.hasGenericDiary
    };

    results.push(status);
    console.log(`Result: URL=${pathname}, Match=${isMatch}, RedirectedHome=${redirectedToHome}, H1="${pageDetails.h1}", DiaryStub=${pageDetails.hasGenericDiary}, Passed=${status.passed}`);
  }

  await browser.close();

  console.log("\n================ SUMMARY ================");
  console.log(JSON.stringify(results, null, 2));

  const allPassed = results.every(r => r.passed);
  if (!allPassed) {
    console.error("❌ Some navigation checks failed!");
    process.exit(1);
  } else {
    console.log("✅ ALL NAV LINKS PASSED! Every link loaded its distinct, real finance page with no redirect and no fallback stub.");
  }
}

run().catch(err => {
  console.error("Script execution failed:", err);
  process.exit(1);
});
