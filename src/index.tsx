import '@modules/check_env.ts'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { bodyLimit } from 'hono/body-limit'
import { secureHeaders } from 'hono/secure-headers'
import { HTTPException } from 'hono/http-exception'
import { serveStatic } from '@hono/node-server/serve-static'
import { poweredBy } from 'hono/powered-by'
import type { SessionDataTypes } from '@modules/types.ts'
import { SessionMiddleware } from '@middleware/session.ts'
import type { SessionSettings } from '@middleware/session.ts'
import { accessLogMiddleware } from '@middleware/accessLog.ts'
import { htmlFormatMiddleware } from '@middleware/htmlFormat.ts'
import { authMiddleware } from '@middleware/auth.tsx'
import { authRateLimiter } from '@middleware/rateLimit.ts'
import { authCtl } from '@routes/auth'
import { memberCtl } from '@routes/member'
import { errorCtl } from '@routes/sample/error'
import { mailCtl } from '@routes/sample/mail'
import { dumpCtl } from '@routes/sample/dump'
import { onError, notFound } from '@modules/exception.ts'

const app = new Hono<{
    Variables: SessionSettings
}>()

app.use(poweredBy())
app.use(secureHeaders())
app.use(csrf())
app.use('/static/*', serveStatic({ root: './' }))
app.use(bodyLimit({
    maxSize: 1 * 1024 * 1024, // 1MB
    onError: () => { throw new HTTPException(413) },
}))
app.use(accessLogMiddleware)
app.post('/auth', authRateLimiter)

if (process.env.NODE_ENV !== 'production') {
    app.use('*', htmlFormatMiddleware)
}

app.use('*', SessionMiddleware());
app.use('/member/*',authMiddleware);

app.get('/', (c) => {
    return c.text('Hello Hono!')
})

app.route('/',authCtl);
app.route('/',memberCtl);
app.route('/',errorCtl);
app.route('/',mailCtl);
app.route('/',dumpCtl);

app.notFound(notFound);
app.onError(onError);

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port
})
