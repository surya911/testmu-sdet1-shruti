/**
 * Login tests — generated from Task 2 prompts
 * Covers: valid login, invalid credentials, forgot password, session expiry, brute-force lockout
 */
import { test, expect } from './hooks';

test.describe('Login', () => {
  test('valid login with correct credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/email|username/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('correctpassword');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/dashboard|home|welcome/i);
  });

  test('invalid credentials show error message', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/email|username/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible();
    await expect(page).toHaveURL(/\//);
  });

  test('forgot password flow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /forgot password/i }).click();
    await page.getByLabel(/email/i).fill('user@example.com');
    await page.getByRole('button', { name: /submit|send|reset/i }).click();
    await expect(page.locator('#message')).toContainText(/inbox|reset|sent/i);
  });

  test('session expiry redirects to login', async ({ page, context }) => {
    // Simulate: login then clear cookies to mimic session expiry
    await page.goto('/');
    await page.getByLabel(/email|username/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('correctpassword');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/dashboard|home/i);
    await context.clearCookies();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login|\//);
  });

  test('brute-force lockout after 5 failed attempts', async ({ page }) => {
    await page.goto('/');
    const emailInput = page.getByLabel(/email|username/i);
    const passwordInput = page.getByLabel(/password/i);
    const submitBtn = page.getByRole('button', { name: /login|sign in/i });

    for (let i = 0; i < 5; i++) {
      await emailInput.fill('user@example.com');
      await passwordInput.fill('wrongpassword');
      await submitBtn.click();
      await page.waitForTimeout(300);
    }

    await expect(page.getByText(/locked|try again|temporarily/i)).toBeVisible();
  });
});
