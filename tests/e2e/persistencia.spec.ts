import { test, expect } from '@playwright/test'

test.describe('Teste de Persistencia de Comentario', () => {
  test('comentario persiste apos recarregar a pagina', async ({ page }) => {
    const apiUrl = 'http://localhost:3001'

    // Seed demo data
    await page.request.post(`${apiUrl}/api/admin/seed-demo`)

    // Login as fiedra client
    await page.request.post(`${apiUrl}/api/auth/cliente/login`, {
      data: { slug: 'fiedra', senha: 'fiedra123', nome: 'Testador QA' },
    })

    // Login via UI
    await page.goto('/c/fiedra')
    await page.waitForLoadState('networkidle')

    const nameInput = page.locator('input[type="text"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('Testador QA')
      await page.fill('input[type="password"]', 'fiedra123')
      await page.click('button[type="submit"]')
    }

    // Navigate to cycle and first piece
    await page.goto('/c/fiedra/ciclo')
    await page.waitForLoadState('networkidle')

    // Check if there are pieces to interact with
    const piecesCards = page.locator('a.card')
    const piecesCount = await piecesCards.count()
    if (piecesCount > 0) {
      await piecesCards.first().click()
      await page.waitForLoadState('networkidle')

      // Find comment textarea
      const textarea = page.locator('textarea').first()
      if (await textarea.isVisible()) {
        const testComment = `Comentario de teste ${Date.now()}`
        await textarea.fill(testComment)
        await page.click('button:has-text("Enviar comentario")')
        await page.waitForTimeout(1500)

        // Reload the page
        await page.reload()
        await page.waitForLoadState('networkidle')

        // Check that comment persists
        const pageContent = await page.content()
        expect(pageContent).toContain(testComment)
        expect(pageContent).toContain('Testador QA')
      }
    }
  })
})
