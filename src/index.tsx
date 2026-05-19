import '@modules/check_env.ts'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type { SessionSettings } from '@middleware/session.ts'
import { security } from '@middleware/security.ts'
import { middlewares } from '@middleware'
import { routes } from '@routes'
import { errorHandlers } from '@modules/exception.ts'

const app = new Hono<{
    Variables: SessionSettings
}>()

security(app)
middlewares(app)

routes(app)

errorHandlers(app)

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port
})
