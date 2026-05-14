import type { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { poweredBy } from 'hono/powered-by'
import { SessionMiddleware } from '@middleware/session.ts'
import { accessLogMiddleware } from '@middleware/accessLog.ts'
import { htmlFormatMiddleware } from '@middleware/htmlFormat.ts'
import { authMiddleware } from '@middleware/auth.tsx'
import { adminAuthMiddleware } from '@middleware/adminAuth.tsx'

export function middlewares(app: Hono<any>) {
    app.use(poweredBy())
    app.use('/static/*', serveStatic({ root: './' }))
    app.use(accessLogMiddleware)
    if (process.env.NODE_ENV !== 'production') {
        app.use('*', htmlFormatMiddleware)
    }
    app.use('*', SessionMiddleware())
    app.use('/member/*', authMiddleware)
    app.use('/admin/*', async (c, next) => {
        if (c.req.path === '/admin/auth') return next()
        return adminAuthMiddleware(c, next)
    })
}
