import { handle } from 'hono/vercel'
import { app } from './bundle.mjs'

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
}

export default handle(app)
