import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { serveStatic } from '@hono/node-server/serve-static'
import { poweredBy } from 'hono/powered-by'
import type { SessionDataTypes } from '@modules/types.ts'
import { SessionMiddleware } from '@middleware/session.ts'
import type { SessionSettings } from '@middleware/session.ts'
import { accessLogMiddleware } from '@middleware/accessLog.ts'
import { authMiddleware } from '@middleware/auth.tsx'
import { authCtl } from '@routes/auth'
import { memberCtl } from '@routes/member'
import { errorLogger } from '@modules/logger.ts'

const app = new Hono<{
    Variables: SessionSettings
}>()

app.use(poweredBy())
app.use(csrf())
app.use('/static/*', serveStatic({ root: './' }))
app.use(accessLogMiddleware)

app.use('*', SessionMiddleware());
app.use('/member/*',authMiddleware);

app.get('/', (c) => {
    return c.text('Hello Hono!')
})

app.route('/',authCtl);
app.route('/',memberCtl);

app.onError((err, c) => {
    errorLogger.error({
        message: err.message,
        stack:   err.stack,
        method:  c.req.method,
        url:     c.req.path,
    });
    return c.text('Internal Server Error', 500);
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port
})
