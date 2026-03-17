import { test, expect } from '@playwright/test';

const email = 'allo@hotmail.com';
const password = 'allo1234';

test('Recipe flow: login, create, modify, and delete', async ({ page }) => {
  const originalRecipeName = `Chocolate Chip Cookies ${Date.now()}`;
  const updatedRecipeName = `Double Chocolate Cookies ${Date.now()}`;

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

  //modify recipe
  await page.goto('https://lzjco-soen-341-project-w26.vercel.app/Recipe%20Managment/SearchRecipes.html');
  await page.waitForLoadState('networkidle');

  const createdCard = page.locator('.recipe-card', {
    has: page.locator('h3', { hasText: originalRecipeName })
  });

  await expect(createdCard).toBeVisible({ timeout: 10000 });
  await createdCard.locator('.btn-edit').click();

  await expect(page).toHaveURL(/CreateRecipes\.html\?editId=/);


  await page.waitForTimeout(1500);

  await page.fill('#recipe-name', updatedRecipeName);
  await page.fill('#cooking-time', '35');
  await page.fill('#portions', '6');
  await page.click('.category-option[data-category="dessert"]');
  await page.fill('#media-url', 'https://example.com/double-chocolate.jpg');

  const ingredientInputs = page.locator('.ingredient-input');
  await ingredientInputs.first().fill('2 cups flour');

  const stepInputs = page.locator('.step-input');
  await stepInputs.first().fill('Mix all ingredients and bake');

  await page.fill('#notes', 'Updated notes');
  await page.click('#save-btn');

  await expect(page.locator('#error-message')).toBeHidden({ timeout: 10000 });
  await expect(page.locator('#success-message')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#success-message')).toContainText(/saved|updated successfully/i);

  // delete recipe
  await page.goto('https://lzjco-soen-341-project-w26.vercel.app/Recipe%20Managment/SearchRecipes.html');
  await page.waitForLoadState('networkidle');

  const updatedCard = page.locator('.recipe-card', {
    has: page.locator('h3', { hasText: updatedRecipeName })
  });

  await expect(updatedCard).toBeVisible({ timeout: 10000 });

  let confirmSeen = false;
  let successSeen = false;

  page.on('dialog', async (dialog) => {
    const message = dialog.message();

    if (message.includes('Are you sure you want to delete this recipe?')) {
      confirmSeen = true;
      await dialog.accept();
    } else if (message.includes('Recipe deleted successfully!')) {
      successSeen = true;
      await dialog.accept();
    }
  });

  await updatedCard.locator('.btn-delete').click();

  await expect.poll(() => confirmSeen).toBe(true);
  await expect.poll(() => successSeen).toBe(true);

  await expect(
    page.locator('.recipe-card', {
      has: page.locator('h3', { hasText: updatedRecipeName })
    })
  ).toHaveCount(0);
});