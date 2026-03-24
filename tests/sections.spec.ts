import { test, expect } from '@playwright/test'

// Wait for fonts + images to settle before snapshotting
async function stabilise(page: any) {
  await page.waitForLoadState('networkidle')
  // Pause any CSS animations so screenshots are deterministic
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }`,
  })
  await page.waitForTimeout(300)
}

// ── Homepage sections ─────────────────────────────────────────────

test('Nav', async ({ page }) => {
  await page.goto('/')
  await stabilise(page)
  const nav = page.locator('nav').first()
  await expect(nav).toHaveScreenshot('nav.png', { maxDiffPixelRatio: 0.02 })
})

test('Hero', async ({ page }) => {
  await page.goto('/')
  await stabilise(page)
  const hero = page.locator('.hero-section').first()
  await expect(hero).toHaveScreenshot('hero.png', { maxDiffPixelRatio: 0.02 })
})

test('Lessons', async ({ page }) => {
  await page.goto('/')
  await stabilise(page)
  // Scroll lessons section into view
  const lessons = page.locator('section').filter({ hasText: 'Real topics. Zero condescension.' }).first()
  await lessons.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await expect(lessons).toHaveScreenshot('lessons.png', { maxDiffPixelRatio: 0.02 })
})

test('Journal', async ({ page }) => {
  await page.goto('/')
  await stabilise(page)
  const journal = page.locator('section').filter({ hasText: /journal|reflection|habit/i }).first()
  await journal.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await expect(journal).toHaveScreenshot('journal.png', { maxDiffPixelRatio: 0.02 })
})

test('Team', async ({ page }) => {
  await page.goto('/about')
  await stabilise(page)
  const ved = page.locator('section').filter({ hasText: 'Ved Bastodkar' }).first()
  await ved.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await expect(ved).toHaveScreenshot('team-ved.png', { maxDiffPixelRatio: 0.02 })

  const dorian = page.locator('section').filter({ hasText: 'Dorian Matuszak' }).first()
  await dorian.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await expect(dorian).toHaveScreenshot('team-dorian.png', { maxDiffPixelRatio: 0.02 })

  const mason = page.locator('section').filter({ hasText: 'Mason Thies' }).first()
  await mason.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await expect(mason).toHaveScreenshot('team-mason.png', { maxDiffPixelRatio: 0.02 })
})

// ── Full page ─────────────────────────────────────────────────────

test('Homepage full page', async ({ page }) => {
  await page.goto('/')
  await stabilise(page)
  await expect(page).toHaveScreenshot('homepage-full.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})

test('About full page', async ({ page }) => {
  await page.goto('/about')
  await stabilise(page)
  await expect(page).toHaveScreenshot('about-full.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
