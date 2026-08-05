import { handle } from 'hono/vercel'
import { app } from '../backend/index'

export default handle(app)
