
const { test, expect } = require("@playwright/test");

let createdUserEmail = null;
let createdUserPassword = null;

// Cleanup function to delete test user
async function cleanupTestUser(page) {
  if (createdUserEmail && createdUserPassword) {
    try {
      // Login as the test user
      await page.goto("https://lzjco-soen-341-project-w26.vercel.app/index.html");
      await page.fill("#email", createdUserEmail);
      await page.fill("#password", createdUserPassword);
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
      
      console.log(`Cleaned up test user: ${createdUserEmail}`);
    } catch (error) {
      console.log(`Cleanup failed for ${createdUserEmail}:`, error.message);
    }
  }
}

test("MealMajor Test: Register/Login", async ({ page }) => {
  const BASE_URL = "https://lzjco-soen-341-project-w26.vercel.app";

  const REGISTER_PAGE = `${BASE_URL}/Authentification Managment/RegisterPage.html`;
  const LOGIN_PAGE = `${BASE_URL}/index.html`;
  const HOME_PAGE = `${BASE_URL}/HomePage.html`;

  // Registering
  await page.goto(REGISTER_PAGE);

  const uniqueEmail = `test_user_${Date.now()}@gmail.com`;
  const password = "Password123"; 

  // Store credentials for cleanup
  createdUserEmail = uniqueEmail;
  createdUserPassword = password;

  await page.fill("#name", "Test User");
  await page.fill("#email", uniqueEmail);
  await page.fill("#password", password);
  await page.fill("#confirm-password", password);

  await page.click("button.primary-btn");


  await expect(page).toHaveURL(/index.html/);


  // Logging in
  await page.goto(LOGIN_PAGE);


  await page.fill("#email", uniqueEmail);
  await page.fill("#password", password);


  await page.click("button.primary-btn");

// Redirection to HomePage after logging in
  await expect(page).toHaveURL(/.*HomePage\.html/);


  const storedUser = await page.evaluate(() => {
    const raw = sessionStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  });

  expect(storedUser).not.toBeNull();
  expect(storedUser.email).toBe(uniqueEmail);
  expect(storedUser.name).toBe("Test User");

  // Clean up test user
  await cleanupTestUser(page);
});