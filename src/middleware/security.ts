import type { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'
import { createMiddleware } from 'hono/factory'
import { errorLogger } from '@modules/logger.ts'

const securityHeaders = secureHeaders({
    referrerPolicy: 'strict-origin-when-cross-origin',
})

// リバースプロキシを考慮したオリジン検証
const csrfProtection = csrf({
    origin: (origin, c) => {
        // /api/ は除外
        if (c.req.path.startsWith('/api/')) return true

        // opaque origin（HTTP→HTTPSリダイレクト後等）はformTokenに委譲
        if (origin === 'null') {
            errorLogger.warn({ msg: 'CSRF opaque origin — passed to form token check', path: c.req.path })
            return true
        }

        const proto = c.req.header('x-forwarded-proto') ?? new URL(c.req.url).protocol.replace(':', '')
        const host  = c.req.header('x-forwarded-host') ?? c.req.header('host') ?? new URL(c.req.url).host
        const requestOrigin = `${proto}://${host}`

        if (origin !== requestOrigin) {
            errorLogger.error({ msg: 'CSRF blocked', path: c.req.path, origin, requestOrigin })
        }
        return origin === requestOrigin
    },
})

const requestSizeLimit = bodyLimit({
    maxSize: 1 * 1024 * 1024, // 1MB
    onError: () => { throw new HTTPException(413) },
})

interface Entry {
    count: number
    resetAt: number
}

function makeRateLimiter(windowMs: number, max: number) {
    const store = new Map<string, Entry>()

    setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of store) {
            if (entry.resetAt < now) store.delete(key)
        }
    }, windowMs)

    return createMiddleware(async (c, next) => {
        const ip =
            c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
            c.req.header('x-real-ip') ??
            'unknown'
        const now = Date.now()
        const entry = store.get(ip)

        if (!entry || entry.resetAt < now) {
            store.set(ip, { count: 1, resetAt: now + windowMs })
        } else {
            entry.count++
            if (entry.count > max) throw new HTTPException(429)
        }
        await next()
    })
}

const authRateLimiter = makeRateLimiter(15 * 60 * 1000, 10)
const mailRateLimiter = makeRateLimiter(10 * 60 * 1000, 3)

export function security(app: Hono<any>) {
    app.use(securityHeaders)
    app.use(csrfProtection)
    app.use(requestSizeLimit)
    app.post('/auth', authRateLimiter)
    app.post('/sample/mail', mailRateLimiter)
}
