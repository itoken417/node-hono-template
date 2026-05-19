import type { Hono, Context } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'
import { createMiddleware } from 'hono/factory'

const securityHeaders = secureHeaders()

// nginx等のリバースプロキシを考慮したオリジン取得
const getRequestOrigin = (c: Context): string => {
    const proto = c.req.header('x-forwarded-proto') ?? new URL(c.req.url).protocol.replace(':', '')
    const host  = c.req.header('x-forwarded-host') ?? c.req.header('host') ?? new URL(c.req.url).host
    return `${proto}://${host}`
}

const csrfProtection = createMiddleware(async (c, next) => {
    if (c.req.path.startsWith('/api/')) return next()

    const isSafeMethod  = /^(GET|HEAD)$/.test(c.req.method)
    const isFormRequest = /^\b(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)\b/i
        .test(c.req.header('content-type') || 'text/plain')

    if (!isSafeMethod && isFormRequest) {
        const requestOrigin = getRequestOrigin(c)
        const origin  = c.req.header('origin')
        const referer = c.req.header('referer')

        const allowed =
            (origin !== undefined && origin === requestOrigin) ||
            (origin === undefined && referer !== undefined &&
                (() => { try { return new URL(referer).origin === requestOrigin } catch { return false } })())

        if (!allowed) throw new HTTPException(403)
    }

    await next()
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
