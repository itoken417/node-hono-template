import '@modules/check_env.ts'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type { SessionSettings } from '@middleware/session.ts'
import { securityMiddlewares } from '@middleware/security.ts'
import { middlewares } from '@middleware'
import { routes } from '@routes'
import { errorHandlers } from '@modules/exception.ts'

const app = new Hono<{
    Variables: SessionSettings
}>()

securityMiddlewares(app)
middlewares(app)

app.get('/', (c) => c.text('Hello Hono!'))
routes(app)

errorHandlers(app)

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port
})
