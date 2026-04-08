import { test, expect } from '@playwright/test';

const FRIDGE_PAGE = 'https://lzjco-soen-341-project-w26.vercel.app/LLM%20Pipeline/fridge.html';

test('Fridge Test: Shows Validation Errors For Empty Input', async ({ page }) => {
  await page.goto(FRIDGE_PAGE);
  await page.click('button:has-text("Generate Meals")');

  await expect(page.locator('#ingredientsError')).toContainText('Please enter ingredients.');
});

test('Fridge Test: Generates Meal Suggestions', async ({ page }) => {
  await page.route('https://generaterecipes-yraqufr7gq-uc.a.run.app', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        text: JSON.stringify({
          recipes: [
            {
              name: 'Spinach Egg Toast',
              calories: 500,
              ingredients: [{ amount: '2', name: 'eggs' }],
              steps: ['Cook and serve']
            }
          ]
        })
      })
    });
  });

  await page.goto(FRIDGE_PAGE);
  await page.fill('#ingredients', 'eggs, spinach, bread');
  await page.fill('#calories', '500');
  await page.click('button:has-text("Generate Meals")');

  await expect(page.locator('#results')).toContainText('Spinach Egg Toast', { timeout: 10000 });
  await expect(page.locator('#results')).toContainText('Calories:');
});
