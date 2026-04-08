import { test, expect } from '@playwright/test';

const BASE_URL = 'https://lzjco-soen-341-project-w26.vercel.app';
const email = 'allo@hotmail.com';
const password = 'allo1234';

async function login(page) {
  await page.goto(`${BASE_URL}/index.html`);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button.primary-btn');
  await page.waitForURL('**/HomePage.html');
}

test('Weekly Planner Test: Homepage Shows Schedule Card', async ({ page }) => {
  await login(page);

  const scheduleCard = page.locator('a.card-link', { hasText: 'YOUR SCHEDULE' });
  await expect(scheduleCard).toBeVisible();
  await expect(scheduleCard).toContainText('YOUR SCHEDULE');
});

test('Weekly Planner Test: Menu Shows Schedule Link', async ({ page }) => {
  await login(page);

  await page.click('#hamburger');
  const scheduleLink = page.locator('#navDropdown a', { hasText: 'Your Schedule' });
  await expect(scheduleLink).toBeVisible();
  await expect(scheduleLink).toContainText('Your Schedule');
});
