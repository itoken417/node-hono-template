import '@modules/check_env.ts'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { poweredBy } from 'hono/powered-by'
import type { SessionDataTypes } from '@modules/types.ts'
import { SessionMiddleware } from '@middleware/session.ts'
import type { SessionSettings } from '@middleware/session.ts'
import { accessLogMiddleware } from '@middleware/accessLog.ts'
import { htmlFormatMiddleware } from '@middleware/htmlFormat.ts'
import { authMiddleware } from '@middleware/auth.tsx'
import { securityMiddlewares } from '@middleware/security.ts'
import { routes } from '@routes/index'
import { onError, notFound } from '@modules/exception.ts'

const app = new Hono<{
    Variables: SessionSettings
}>()

app.use(poweredBy())
securityMiddlewares(app)
app.use('/static/*', serveStatic({ root: './' }))
app.use(accessLogMiddleware)

if (process.env.NODE_ENV !== 'production') {
    app.use('*', htmlFormatMiddleware)
}

app.use('*', SessionMiddleware());
app.use('/member/*',authMiddleware);

app.get('/', (c) => {
    return c.text('Hello Hono!')
})

routes(app)

app.notFound(notFound);
app.onError(onError);

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port
})
