import { chromium } from 'playwright-core';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'docs/src/assets/screenshots');
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3000';
const CHROMIUM_PATH = '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

function apiLogin(username) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ username, password: 'demo123' });
    const req = http.request(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body).data.token); }
        catch (e) { reject(new Error(`Login failed for ${username}: ${body}`)); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function screenshot(page, name) {
  const fpath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await delay(500);
  await page.screenshot({ path: fpath, fullPage: true });
  console.log(`  OK ${name}.png (${page.url().replace(BASE_URL, '')})`);
}

// Login and wait for the app to fully load (avoids race condition)
async function loginAs(page, username) {
  const token = await apiLogin(username);

  // Navigate to login page first
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await delay(300);

  // Set token and reload - the app will redirect to default route
  await page.evaluate((tok) => {
    localStorage.setItem('gemba_token', tok);
  }, token);

  // Reload to trigger auth with the token set
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });

  // Wait for the sidebar to appear (proves auth loaded)
  try {
    await page.waitForSelector('.sidebar', { timeout: 8000 });
  } catch {
    // Might still be on login page, try reload
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('.sidebar', { timeout: 5000 });
  }
  await delay(1500);
}

// Click sidebar nav item with scroll support
async function clickNav(page, linkText) {
  // Scroll sidebar nav to bottom to make all items visible
  await page.evaluate(() => {
    const nav = document.querySelector('.sidebar-nav');
    if (nav) nav.scrollTop = nav.scrollHeight;
  });
  await delay(300);

  const link = page.locator('.nav-item').filter({ hasText: linkText }).first();
  try {
    await link.scrollIntoViewIfNeeded({ timeout: 3000 });
    await link.click({ timeout: 3000 });
  } catch {
    // Try scrolling to top and looking again
    await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      if (nav) nav.scrollTop = 0;
    });
    await delay(200);
    await link.click({ timeout: 3000 });
  }

  await page.waitForLoadState('networkidle');
  await delay(2000);
}

// Wait for meaningful content to appear
async function waitForContent(page) {
  try {
    await page.waitForSelector('.card, .stats-grid, .issue-list, .data-table, .empty-state, .safety-grid', { timeout: 6000 });
    await delay(500);
  } catch {
    await delay(1000);
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Block external requests
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith('data:')) return route.continue();
    return route.abort();
  });

  // Log errors for debugging
  page.on('pageerror', err => console.log('    PAGE ERROR:', err.message.split('\n')[0]));

  try {
    // ==================== LOGIN PAGE ====================
    console.log('Login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1500);
    await screenshot(page, 'login');

    // ==================== LEVEL 1 - TEAM MEMBER ====================
    console.log('Level 1 pages (team1)...');
    await loginAs(page, 'team1');
    // Lands on /level1 (default for L1 role)
    await waitForContent(page);
    await screenshot(page, 'level1-workstation-selection');

    // Click first workstation card (nested .card inside outer .card)
    try {
      const wsCard = page.locator('.card .card').first();
      if (await wsCard.isVisible({ timeout: 2000 })) {
        await wsCard.click();
        await delay(2500);
        await waitForContent(page);
        await screenshot(page, 'level1-production');
      }
    } catch (e) {
      console.log(`  Workstation click: ${e.message.split('\n')[0]}`);
    }

    // Navigate via sidebar
    try { await clickNav(page, 'Issue Escalations'); await waitForContent(page); await screenshot(page, 'escalations'); } catch (e) { console.log(`  escalations: ${e.message.split('\n')[0]}`); }
    try { await clickNav(page, 'Safety Cross'); await waitForContent(page); await screenshot(page, 'safety-cross'); } catch (e) { console.log(`  safety-cross: ${e.message.split('\n')[0]}`); }
    try { await clickNav(page, 'Shift Handover'); await waitForContent(page); await screenshot(page, 'handover'); } catch (e) { console.log(`  handover: ${e.message.split('\n')[0]}`); }

    // ==================== LEVEL 2 - AREA LEADER ====================
    console.log('Level 2 pages (leader1)...');
    await loginAs(page, 'leader1');
    // Lands on /level2 (default for L2 role)
    await waitForContent(page);
    await screenshot(page, 'level2');

    try { await clickNav(page, 'Issue Resolution'); await waitForContent(page); await screenshot(page, 'resolution'); } catch (e) { console.log(`  resolution: ${e.message.split('\n')[0]}`); }
    try { await clickNav(page, 'Issue Dashboard'); await waitForContent(page); await screenshot(page, 'dashboard'); } catch (e) { console.log(`  dashboard: ${e.message.split('\n')[0]}`); }
    try { await clickNav(page, 'Issue History'); await waitForContent(page); await screenshot(page, 'issue-history'); } catch (e) { console.log(`  issue-history: ${e.message.split('\n')[0]}`); }
    try { await clickNav(page, 'Gemba Walk'); await waitForContent(page); await screenshot(page, 'gemba-walk'); } catch (e) { console.log(`  gemba-walk: ${e.message.split('\n')[0]}`); }

    // Analytics - not in sidebar, navigate programmatically
    try {
      await page.evaluate(() => {
        window.history.pushState({}, '', '/analytics');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await delay(2500);
      await waitForContent(page);
      await screenshot(page, 'analytics');
    } catch (e) { console.log(`  analytics: ${e.message.split('\n')[0]}`); }

    // ==================== LEVEL 3 - PLANT MANAGER ====================
    console.log('Level 3 pages (manager1)...');
    await loginAs(page, 'manager1');
    // Lands on /level3 (default for L3 role)
    await waitForContent(page);
    await screenshot(page, 'level3');

    // ==================== ADMIN ====================
    console.log('Admin pages...');
    await loginAs(page, 'admin');
    // Lands on /admin/config
    await waitForContent(page);
    await screenshot(page, 'admin-workstations');

    const adminTabs = [
      { text: 'Categorys', file: 'categories' },
      { text: 'Areas', file: 'areas' },
      { text: 'Teams', file: 'teams' },
      { text: 'Operators', file: 'operators' },
      { text: 'Shifts', file: 'shifts' },
      { text: 'Users', file: 'users' },
    ];
    for (const { text: tabName, file: fileName } of adminTabs) {
      try {
        const tab = page.locator('button').filter({ hasText: tabName }).first();
        await tab.scrollIntoViewIfNeeded({ timeout: 2000 });
        await tab.click({ timeout: 2000 });
        await delay(1200);
        await screenshot(page, `admin-${fileName}`);
      } catch (e) {
        console.log(`  admin-${fileName}: ${e.message.split('\n')[0]}`);
      }
    }

  } catch (err) {
    console.error('FATAL:', err.message);
    try { await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'debug-error.png'), fullPage: true }); } catch {}
  }

  await browser.close();
  console.log('\nDone!');
})();
