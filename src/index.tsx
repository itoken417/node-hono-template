import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { serveStatic } from '@hono/node-server/serve-static'
import { poweredBy } from 'hono/powered-by'
import { logger } from 'hono/logger'
import type { SessionDataTypes } from '@modules/types.ts'
import { Session } from 'hono-sessions'
import sessionMiddleware from '@middleware/session.ts'
import { authMiddleware } from '@middleware/auth.tsx'
import { authCtl } from '@routes/auth'
import { memberCtl } from '@routes/member'

const app = new Hono<{
    Variables: {
        session: Session<SessionDataTypes>,
        session_key_rotation: boolean
    }
}>()
app.use(poweredBy())
app.use(logger())
app.use(csrf())
app.use('/static/*', serveStatic({ root: './' }))


app.use('*', sessionMiddleware());
app.use('/member/*',authMiddleware);

app.get('/', (c) => {
    return c.text('Hello Hono!')
})

app.route('/',authCtl);
app.route('/',memberCtl);

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port
})
