import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  snapshotDir: './tests/snapshots',
  updateSnapshots: 'missing',
  use: {
    baseURL: 'http://localhost:3000',
    // Disable animations so screenshots are stable
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' },
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 }, reducedMotion: 'reduce' },
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
    },
  ],
})
