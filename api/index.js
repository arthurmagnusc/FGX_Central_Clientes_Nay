import { handle } from 'hono/vercel'
import { app } from './bundle.mjs'

export default handle(app)
