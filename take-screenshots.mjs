import { chromium } from 'playwright-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'docs/src/assets/screenshots');
const BASE_URL = 'http://localhost:5173';
const CHROMIUM_PATH = '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome';

async function quickLogin(page, buttonText) {
  // Clear previous auth state
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 1000));
  const btn = page.locator('button').filter({ hasText: buttonText });
  await btn.click();
  await page.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 2500));
}

async function screenshot(page, name) {
  const fpath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: fpath, fullPage: true });
  console.log(`  ✓ ${name}.png`);
}

async function navigateAndScreenshot(page, url, name) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 2500));
  await screenshot(page, name);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Block external requests (Google Fonts, etc.) to prevent ERR_NAME_NOT_RESOLVED crashes
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith('data:')) {
      return route.continue();
    }
    return route.abort();
  });

  // ===================== LOGIN PAGE =====================
  console.log('📸 Login page...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 1500));
  await screenshot(page, 'login');

  // ===================== LEVEL 1 - TEAM MEMBER =====================
  console.log('📸 Level 1 pages (team1)...');
  await quickLogin(page, 'Level 1 - Teams');
  await new Promise(r => setTimeout(r, 2000));
  await screenshot(page, 'level1-workstation-selection');

  // Try clicking first workstation card
  try {
    const firstCard = page.locator('[class*="card"]').first();
    if (await firstCard.isVisible({ timeout: 3000 })) {
      await firstCard.click();
      await new Promise(r => setTimeout(r, 2500));
      await screenshot(page, 'level1-production');
    }
  } catch (e) {
    console.log('  (no workstation card clickable)');
  }

  await navigateAndScreenshot(page, `${BASE_URL}/escalations`, 'escalations');
  await navigateAndScreenshot(page, `${BASE_URL}/safety-cross`, 'safety-cross');
  await navigateAndScreenshot(page, `${BASE_URL}/handover`, 'handover');

  // ===================== LEVEL 2 - AREA LEADER =====================
  console.log('📸 Level 2 pages (leader1)...');
  await quickLogin(page, 'Level 2 - Areas');

  await navigateAndScreenshot(page, `${BASE_URL}/level2`, 'level2');
  await navigateAndScreenshot(page, `${BASE_URL}/dashboard`, 'dashboard');
  await navigateAndScreenshot(page, `${BASE_URL}/issue-history`, 'issue-history');
  await navigateAndScreenshot(page, `${BASE_URL}/resolution`, 'resolution');
  await navigateAndScreenshot(page, `${BASE_URL}/gemba-walk`, 'gemba-walk');
  await navigateAndScreenshot(page, `${BASE_URL}/analytics`, 'analytics');

  // ===================== LEVEL 3 - PLANT MANAGER =====================
  console.log('📸 Level 3 pages (manager1)...');
  await quickLogin(page, 'Level 3 - Plant');

  await navigateAndScreenshot(page, `${BASE_URL}/level3`, 'level3');

  // ===================== ADMIN =====================
  console.log('📸 Admin pages...');
  await quickLogin(page, 'Admin');

  await navigateAndScreenshot(page, `${BASE_URL}/admin/config`, 'admin-workstations');

  const tabNames = ['Categories', 'Areas', 'Teams', 'Operators', 'Shifts', 'Users'];
  for (const tabName of tabNames) {
    try {
      const tab = page.locator('button').filter({ hasText: new RegExp(`^${tabName}$`, 'i') }).first();
      if (await tab.isVisible({ timeout: 3000 })) {
        await tab.click();
        await new Promise(r => setTimeout(r, 1500));
        await screenshot(page, `admin-${tabName.toLowerCase()}`);
      }
    } catch (e) {
      console.log(`  (could not click tab: ${tabName})`);
    }
  }

  await browser.close();
  console.log('\n✅ All screenshots captured!');
})();
