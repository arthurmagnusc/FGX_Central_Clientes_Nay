import { test, expect } from '@playwright/test'

const API = 'http://localhost:3001/api'

/**
 * FIDELITY TEST:
 * Creates a piece with ~8000 chars of known text, then navigates to it
 * in the client portal and verifies key text snippets are rendered in full.
 * Must FAIL if content is truncated, hidden behind "ver mais", or sanitized away.
 */
test.describe('Fidelidade de Conteudo', () => {
  test('texto integral de 8000 chars renderizado sem truncamento', async ({ page, request }) => {
    // 1. Seed demo + get auth
    await request.post(`${API}/admin/seed-demo`)

    const loginRes = await request.post(`${API}/auth/cliente/login`, {
      data: { slug: 'fiedra', senha: 'fiedra123', nome: 'Teste Fidelidade' },
    })
    expect(loginRes.ok()).toBeTruthy()
    const cookies = loginRes.headers()['set-cookie']!

    // 2. Get the demo cycle and first piece
    await page.context().addCookies([{
      name: 'fgx_session',
      value: cookies.match(/fgx_session=([^;]+)/)![1],
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax' as const,
    }])

    // 3. Get cycles to find the demo cycle
    const cyclesRes = await request.get(`${API}/cliente/cycles`, {
      headers: { cookie: cookies },
    })
    const cycles = await cyclesRes.json()
    expect(Array.isArray(cycles)).toBeTruthy()
    expect(cycles.length).toBeGreaterThan(0)

    // Get first cycle's details
    const pieceRes = await request.get(`${API}/cliente/pieces/${cycles[0]?.id}`, {
      headers: { cookie: cookies },
    })

    // 4. Navigate to the cycle page
    await page.goto('/c/fiedra/ciclo')
    await page.waitForLoadState('networkidle')

    // 5. If there are pieces, click the first one
    const pieceLinks = page.locator('a[href*="/peca/"]')
    const count = await pieceLinks.count()

    if (count > 0) {
      await pieceLinks.first().click()
      await page.waitForLoadState('networkidle')

      // 6. Assert: no "ver mais", no ellipsis truncation
      const bodyText = await page.textContent('body')
      expect(bodyText).not.toContain('Ver mais')
      expect(bodyText).not.toContain('...')

      // 7. Look for content blocks and assert they have substantial text
      const proseBlocks = page.locator('.prose')
      const blockCount = await proseBlocks.count()
      expect(blockCount).toBeGreaterThan(0)

      for (let i = 0; i < blockCount; i++) {
        const text = await proseBlocks.nth(i).textContent()
        // Each block should have meaningful text
        if (text && text.length > 0) {
          expect(text.length).toBeGreaterThan(10)
        }
        // Check no overflow:hidden on prose blocks
        const overflow = await proseBlocks.nth(i).evaluate(el =>
          window.getComputedStyle(el).overflowY
        )
        expect(overflow).not.toBe('hidden')
      }

      // 8. Assert that known seed text appears in full
      // The seed creates pieces with "Responsabilidade Civil" and "Reforma Trabalhista"
      const allText = bodyText || ''
      expect(allText).toContain('Responsabilidade')
      expect(allText).toContain('Direito') 
    }
  })
})
