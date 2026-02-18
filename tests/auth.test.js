
const { test, expect } = require("@playwright/test");

test("MealMajor Test: Register/Login", async ({ page }) => {
  const BASE_URL = "http://localhost:8000";

  const REGISTER_PAGE = `${BASE_URL}/Authentification Managment/RegisterPage.html`;
  const LOGIN_PAGE = `${BASE_URL}/index.html`;
  const HOME_PAGE = `${BASE_URL}/HomePage.html`;

  // Registering
  await page.goto(REGISTER_PAGE);

  const uniqueEmail = `test_user_${Date.now()}@gmail.com`;
  const password = "Password123"; 

  await page.fill("#name", "Test User");
  await page.fill("#email", uniqueEmail);
  await page.fill("#password", password);
  await page.fill("#confirm-password", password);

  await page.click("button.primary-btn");


  await expect(page).toHaveURL(/.*index\.html/);


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
});