import { handle } from 'hono/vercel'
import { app } from '../lib/api-bundle.mjs'

export default handle(app)
