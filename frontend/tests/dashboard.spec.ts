import { test, expect } from '@playwright/test';

test.describe('Dashboard Performance & Components', () => {
    test.beforeEach(async ({ page }) => {
        // Authenticate the user before each test (assuming the JWT cookie is set)
        // For E2E, we can just login once and use a global state, but for simplicity here we login
        await page.goto('/auth/login');
        await page.fill('input[name="email"]', 'admin@dvttalent.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*\/dashboard/);
    });

    test('should render all dashboard components correctly', async ({ page }) => {
        // Check for KPI cards
        await expect(page.locator('text=Companies Found')).toBeVisible();
        await expect(page.locator('text=Active Leads')).toBeVisible();
        await expect(page.locator('text=Candidates')).toBeVisible();
        await expect(page.locator('text=Emails Sent')).toBeVisible();

        // Check for AI Agents panel
        await expect(page.locator('text=AI Agents')).toBeVisible();
        await expect(page.locator('text=Market Intel')).toBeVisible();

        // Check for Activity Feed
        await expect(page.locator('text=Agent Activity')).toBeVisible();
    });

    test('should trigger an AI agent task', async ({ page }) => {
        // Click on Market Intel agent
        await page.click('text=Market Intel');
        
        // Wait for the success toast (Sonner)
        await expect(page.locator('text=market intelligence started')).toBeVisible();
        
        // Check that the agent card shows the spinner (running state)
        // Assuming the card has some indicator we can select
        const agentCard = page.locator('div:has-text("Market Intel")');
        // We look for the spinner element we added in the refactor
        await expect(agentCard.locator('.animate-spin')).toBeVisible();
    });

    test('should refresh dashboard data', async ({ page }) => {
        const refreshBtn = page.locator('button:has(.lucide-refresh-cw)');
        await refreshBtn.click();
        
        // Ensure the spinner starts and then stops
        await expect(refreshBtn.locator('.animate-spin')).toBeVisible();
        await expect(refreshBtn.locator('.animate-spin')).not.toBeVisible();
    });
});
