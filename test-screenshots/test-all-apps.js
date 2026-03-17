const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, 'screenshots');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const DOMAIN = process.env.DOMAIN || 'enathager.com';

const APPS = {
  admin: {
    baseUrl: `https://admin.${DOMAIN}`,
    loginPath: '/login',
    credentials: { email: 'admin@directory-saas.local', password: 'admin123' },
    publicPages: [
      { name: 'login', path: '/login' },
    ],
    protectedPages: [
      { name: 'dashboard', path: '/' },
      { name: 'tenants', path: '/tenants' },
      { name: 'users', path: '/users' },
      { name: 'roles', path: '/roles' },
      { name: 'subscriptions', path: '/subscriptions' },
      { name: 'audit-logs', path: '/audit-logs' },
      { name: 'jobs', path: '/jobs' },
      { name: 'settings', path: '/settings' },
    ],
  },
  web: {
    baseUrl: `https://app.${DOMAIN}`,
    loginPath: '/login',
    credentials: null, // No seeded client user yet
    publicPages: [
      { name: 'landing', path: '/' },
      { name: 'login', path: '/login' },
      { name: 'register', path: '/register' },
      { name: 'search', path: '/search' },
      { name: 'categories', path: '/categories' },
    ],
    protectedPages: [],
  },
  provider: {
    baseUrl: `https://admin.${DOMAIN}`, // No wildcard subdomain for testing
    loginPath: '/login',
    credentials: null, // No seeded provider user
    publicPages: [],
    protectedPages: [],
  },
};

async function screenshot(page, name, appName) {
  const filePath = path.join(OUTPUT_DIR, `${appName}-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  📸 ${filePath}`);
}

async function login(page, app) {
  if (!app.credentials) return false;

  await page.goto(`${app.baseUrl}${app.loginPath}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Fill login form
  const emailInput = await page.$('input[type="email"], input#email');
  const passwordInput = await page.$('input[type="password"], input#password');

  if (!emailInput || !passwordInput) {
    console.log('  ⚠️  Login form not found');
    return false;
  }

  await emailInput.fill(app.credentials.email);
  await passwordInput.fill(app.credentials.password);

  // Click submit
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await page.waitForTimeout(3000);
  }

  const url = page.url();
  const isLoggedIn = !url.includes('/login');
  console.log(`  ${isLoggedIn ? '✅' : '❌'} Login ${isLoggedIn ? 'succeeded' : 'failed'} → ${url}`);
  return isLoggedIn;
}

async function testApp(browser, appName, app) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Testing ${appName.toUpperCase()} — ${app.baseUrl}`);
  console.log(`${'='.repeat(60)}`);

  const issues = [];

  // Test public pages
  for (const pg of app.publicPages) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    try {
      const resp = await page.goto(`${app.baseUrl}${pg.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      const status = resp?.status() || 0;
      const currentUrl = page.url();
      const title = await page.title();

      console.log(`\n  📄 ${pg.name} (${pg.path})`);
      console.log(`     Status: ${status} | URL: ${currentUrl} | Title: ${title}`);

      if (errors.length > 0) {
        console.log(`     ⚠️  Console errors: ${errors.length}`);
        errors.slice(0, 3).forEach(e => console.log(`       - ${e.slice(0, 120)}`));
        issues.push({ app: appName, page: pg.name, type: 'console-error', errors });
      }

      // Check for blank page
      const bodyText = await page.evaluate(() => document.body?.innerText?.trim() || '');
      if (bodyText.length < 10) {
        console.log(`     ❌ Page appears blank`);
        issues.push({ app: appName, page: pg.name, type: 'blank-page' });
      }

      await screenshot(page, pg.name, appName);
    } catch (err) {
      console.log(`  ❌ ${pg.name}: ${err.message.slice(0, 150)}`);
      issues.push({ app: appName, page: pg.name, type: 'error', message: err.message });
      await screenshot(page, `${pg.name}-error`, appName).catch(() => {});
    }

    await context.close();
  }

  // Test protected pages (login first)
  if (app.protectedPages.length > 0 && app.credentials) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    const loggedIn = await login(page, app);
    if (loggedIn) {
      await screenshot(page, 'after-login', appName);

      for (const pg of app.protectedPages) {
        errors.length = 0;
        try {
          await page.goto(`${app.baseUrl}${pg.path}`, { waitUntil: 'networkidle', timeout: 15000 });
          await page.waitForTimeout(2000);

          const currentUrl = page.url();
          console.log(`\n  📄 ${pg.name} (${pg.path})`);
          console.log(`     URL: ${currentUrl}`);

          if (errors.length > 0) {
            console.log(`     ⚠️  Console errors: ${errors.length}`);
            errors.slice(0, 3).forEach(e => console.log(`       - ${e.slice(0, 120)}`));
            issues.push({ app: appName, page: pg.name, type: 'console-error', errors: [...errors] });
          }

          // Check for error states in the UI
          const errorAlert = await page.$('.bg-destructive, [role="alert"]');
          if (errorAlert) {
            const alertText = await errorAlert.textContent();
            console.log(`     ⚠️  Error alert: ${alertText?.slice(0, 100)}`);
          }

          await screenshot(page, pg.name, appName);
        } catch (err) {
          console.log(`  ❌ ${pg.name}: ${err.message.slice(0, 150)}`);
          issues.push({ app: appName, page: pg.name, type: 'error', message: err.message });
          await screenshot(page, `${pg.name}-error`, appName).catch(() => {});
        }
      }
    } else {
      console.log('  ❌ Could not login, skipping protected pages');
      await screenshot(page, 'login-failed', appName);
      issues.push({ app: appName, page: 'login', type: 'login-failed' });
    }

    await context.close();
  }

  return issues;
}

(async () => {
  console.log('🚀 Directory SaaS — Full App Test Suite');
  console.log(`   Timestamp: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({ headless: true });
  const allIssues = [];

  for (const [appName, app] of Object.entries(APPS)) {
    const issues = await testApp(browser, appName, app);
    allIssues.push(...issues);
  }

  await browser.close();

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SUMMARY');
  console.log(`${'='.repeat(60)}`);
  if (allIssues.length === 0) {
    console.log('✅ All tests passed — no issues found');
  } else {
    console.log(`❌ Found ${allIssues.length} issue(s):\n`);
    allIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. [${issue.app}] ${issue.page} — ${issue.type}${issue.message ? ': ' + issue.message.slice(0, 100) : ''}`);
    });
  }

  console.log(`\n📁 Screenshots saved to: ${OUTPUT_DIR}`);
})();
