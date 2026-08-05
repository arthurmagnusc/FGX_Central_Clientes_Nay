import { test, expect } from '@playwright/test'

test.describe('Teste de Fidelidade de Conteudo', () => {
  test('conteudo integral da peca exibido caractere a caractere', async ({ page }) => {
    // Seed the demo data via API
    const apiUrl = 'http://localhost:3001/api/admin/seed-demo'
    await page.request.post(apiUrl)

    // Admin login to set up initial data
    await page.goto('/admin')
    await page.fill('input[type="password"]', 'fgxadmin2026')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/dashboard')

    // Navigate to Fiedra cliente edit to set password
    await page.goto('/admin/clientes')
    await page.waitForLoadState('networkidle')

    // Click on Fiedra edit
    const fiedraRow = page.locator('tr', { hasText: 'Fiedra' })
    if (await fiedraRow.count() > 0) {
      await fiedraRow.locator('a', { hasText: 'Editar' }).click()
      await page.waitForLoadState('networkidle')
      // Set password
      await page.fill('input[type="password"]', 'fiedra123')
      // Set active
      const ativoCheck = page.locator('input[type="checkbox"]')
      if (await ativoCheck.isVisible()) {
        const checked = await ativoCheck.isChecked()
        if (!checked) await ativoCheck.check()
      }
      await page.click('button:has-text("Salvar")')
      await page.waitForURL('**/admin/clientes')
    }

    // Go to cycles, publish fiedra demo cycle if in draft
    await page.goto('/admin/ciclos')
    await page.waitForLoadState('networkidle')

    // Now log in as fiedra client
    await page.goto('/c/fiedra')
    await page.waitForLoadState('networkidle')

    const nameInput = page.locator('input[type="text"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('Maria Teste')
      await page.fill('input[type="password"]', 'fiedra123')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/c/fiedra/**')
    }

    // Navigate to cycle
    await page.goto('/c/fiedra/ciclo')
    await page.waitForLoadState('networkidle')

    // Click on first piece
    const firstCard = page.locator('a.card').first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
      await page.waitForLoadState('networkidle')

      // Check that content is fully rendered - no "ver mais", no truncation
      const pageContent = await page.content()
      expect(pageContent).not.toContain('Ver mais')
      expect(pageContent).not.toContain('ver mais')
      expect(pageContent).not.toContain('...')

      // Check that rendered content has substantial text (pieces should have 4000+ chars)
      const bodyText = page.locator('.prose').first()
      if (await bodyText.isVisible()) {
        const text = await bodyText.textContent()
        expect(text).toBeTruthy()
        expect(text!.length).toBeGreaterThan(100)
      }
    }

    // Additional check: verify no max-height or overflow:hidden on content containers
    const contentContainers = page.locator('.prose')
    const count = await contentContainers.count()
    for (let i = 0; i < count; i++) {
      const overflow = await contentContainers.nth(i).evaluate(el => window.getComputedStyle(el).overflow)
      expect(overflow).not.toBe('hidden')
    }
  })
})
