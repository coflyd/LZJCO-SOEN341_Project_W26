import { test, expect } from '@playwright/test';

const email = 'allo@hotmail.com';
const password = 'allo1234';

test('Recipe flow: login, create, modify, and delete', async ({ page }) => {
  const originalRecipeName = `Chocolate Chip Cookies`;
  const updatedRecipeName = `Double Chocolate Cookies`;

  // Login
  await page.goto('https://lzjco-soen-341-project-w26.vercel.app/index.html');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button.primary-btn');
  await page.waitForURL('**/HomePage.html');

  // create recipe
  await page.goto('https://lzjco-soen-341-project-w26.vercel.app/Recipe%20Managment/CreateRecipes.html');

  await page.fill('#recipe-name', originalRecipeName);
  await page.fill('#cooking-time', '30');
  await page.fill('#portions', '4');
  await page.click('.category-option[data-category="dessert"]');
  await page.fill('#media-url', 'https://example.com/cookies.jpg');

  await page.locator('.ingredient-input').first().fill('2 cups flour');
  await page.click('#add-ingredient');
  await page.locator('.ingredient-input').nth(1).fill('1 cup sugar');

  await page.locator('.step-input').first().fill('Preheat the oven to 350°F (175°C)');
  await page.click('#add-step');
  await page.locator('.step-input').nth(1).fill('Mix all ingredients');

  await page.fill('#notes', 'Best served warm');
  await page.click('#save-btn');

  await expect(page.locator('#success-message')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#success-message')).toContainText(/saved successfully/i);

  
});