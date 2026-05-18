import type { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { poweredBy } from 'hono/powered-by'
import { session } from '@middleware/session.ts'
import { accessLog } from '@middleware/accessLog.ts'
import { htmlFormat } from '@middleware/htmlFormat.ts'
import { auth } from '@middleware/auth.tsx'
import { adminAuth } from '@middleware/adminAuth.tsx'

export function middlewares(app: Hono<any>) {
    app.use(poweredBy())
    app.use('/static/*', serveStatic({ root: './' }))
    app.use(accessLog)
    if (process.env.NODE_ENV !== 'production') {
        app.use('*', htmlFormat)
    }
    app.use('*', session())
    app.use('/member/*', auth)
    app.use('/admin/*', async (c, next) => {
        if (c.req.path === '/admin/auth') return next()
        return adminAuth(c, next)
    })
}
