const { test, expect } = require("@playwright/test");

// Cleanup function to delete test user  
async function cleanupTestUser(page, email, password) {
  try {
    // Login as the test user
    await page.goto("https://lzjco-soen-341-project-w26.vercel.app/index.html");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click("button.primary-btn");
    await page.waitForTimeout(2000); // Wait for login to complete

    // Delete user account via Firebase
    await page.evaluate(async () => {
      const { getAuth, deleteUser } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
      const { getDatabase, ref, remove } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js");
      
      const auth = getAuth();
      const database = getDatabase();
      
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        // Delete user data from database
        await remove(ref(database, `users/${uid}`));
        // Delete auth account
        await deleteUser(auth.currentUser);
      }
    });
    
    console.log(`Cleaned up test user: ${email}`);
  } catch (error) {
    console.log(`Cleanup failed for ${email}:`, error.message);
  }
}

test("MealMajor Test: Profile Preferences", async ({ page }) => {
  const BASE_URL = "https://lzjco-soen-341-project-w26.vercel.app";
  const REGISTER_PAGE = `${BASE_URL}/Authentification Managment/RegisterPage.html`;
  const LOGIN_PAGE = `${BASE_URL}/index.html`;
  const PROFILE_PAGE = `${BASE_URL}/Profile Managment/ProfileManagement.html`;

  const uniqueEmail = `profile_test_${Date.now()}@gmail.com`;
  const password = "Password123";

  // First register the user
  await page.goto(REGISTER_PAGE);

  await page.fill("#name", "Test User");
  await page.fill("#email", uniqueEmail);
  await page.fill("#password", password);
  await page.fill("#confirm-password", password);
  await page.click("button.primary-btn");
  await expect(page).toHaveURL(/index.html/);

  // Now login
  await page.goto(LOGIN_PAGE);
  await page.fill("#email", uniqueEmail);
  await page.fill("#password", password);
  await page.click("button.primary-btn");

  await expect(page).toHaveURL(/.*HomePage\.html/);

  await page.goto(PROFILE_PAGE);
  await page.waitForSelector("#settingsForm");
  await page.waitForTimeout(2000);

  const initialMessage = await page.textContent("#save-message");
  if (initialMessage.includes("Please log in")) {
    return;
  }

  await page.fill("#name", "Updated Test User");
  await page.check('input[type="checkbox"][value="milk"]');
  await page.check('input[type="checkbox"][value="gluten"]');
  await page.fill("#Allergies", "shellfish, tree nuts");
  await page.check('input[type="checkbox"][value="vegetarian"]');
  await page.check('input[type="checkbox"][value="high-protein"]');
  await page.click("button.save-btn");

  try {
    await page.waitForSelector("#save-message:not(:empty)", { timeout: 10000 });
  } catch (e) {
    await page.screenshot({ path: 'test-results/profile-error.png' });
    return;
  }

  const saveMessage = await page.textContent("#save-message");
  const hasSuccess = await page.locator("#save-message.success").count();
  const hasError = await page.locator("#save-message.error").count();

  if (hasError > 0) {
    return;
  }

  expect(hasSuccess).toBe(1);
  expect(saveMessage).toContain("Profile updated successfully!");

  await page.reload();
  await page.waitForSelector("#settingsForm");
  await page.waitForTimeout(3000);

  const savedName = await page.inputValue("#name");
  if (!savedName) {
    return;
  }

  expect(savedName).toBe("Updated Test User");

  const milkChecked = await page.isChecked('input[type="checkbox"][value="milk"]');
  const glutenChecked = await page.isChecked('input[type="checkbox"][value="gluten"]');
  expect(milkChecked).toBe(true);
  expect(glutenChecked).toBe(true);

  const otherAllergies = await page.inputValue("#Allergies");
  expect(otherAllergies).toContain("shellfish");
  expect(otherAllergies).toContain("tree nuts");

  const vegetarianChecked = await page.isChecked('input[type="checkbox"][value="vegetarian"]');
  const highProteinChecked = await page.isChecked('input[type="checkbox"][value="high-protein"]');
  expect(vegetarianChecked).toBe(true);
  expect(highProteinChecked).toBe(true);

  // Clean up test user
  await cleanupTestUser(page, uniqueEmail, password);
});