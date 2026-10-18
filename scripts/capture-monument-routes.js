const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../packages/ai-core/node_modules/puppeteer'));
const fs = require('fs');

async function capture() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const routes = [
    { name: 'route_editorial_home', path: '/' },
    { name: 'route_explore_articles', path: '/explore-longform-articles' },
    { name: 'route_interactive_city_map', path: '/interactive-city-map' },
    { name: 'route_architect_portfolio', path: '/architect-portfolio' },
    { name: 'route_filter_building_archive', path: '/filter-building-archive' },
    { name: 'route_save_article_bookmarks', path: '/save-article-bookmarks' },
    { name: 'route_portfolios_feature', path: '/portfolios' }
  ];

  const outDir = path.resolve('projects/monument-test/.aegis/screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const r of routes) {
    try {
      const url = `http://localhost:5173${r.path}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise(res => setTimeout(res, 800));
      const file = path.join(outDir, `${r.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`Captured ${r.name} -> ${file}`);
    } catch (err) {
      console.error(`Failed ${r.name}:`, err.message);
    }
  }

  // Mobile test at 390x844
  try {
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:5173/explore-longform-articles', { waitUntil: 'networkidle2', timeout: 10000 });
    await new Promise(res => setTimeout(res, 800));
    const mobileFile = path.join(outDir, 'mobile_390x844_articles.png');
    await page.screenshot({ path: mobileFile, fullPage: true });
    console.log(`Captured mobile_390x844_articles -> ${mobileFile}`);
  } catch (err) {
    console.error('Failed mobile articles:', err.message);
  }

  await browser.close();
}

capture().catch(console.error);
