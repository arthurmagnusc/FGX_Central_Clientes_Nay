import { getRequestListener } from '@hono/node-server'
import { app } from './index'

const listener = getRequestListener(app.fetch)

export default function handler(req: any, res: any) {
  return listener(req, res)
}
