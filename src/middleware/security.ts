import { secureHeaders } from 'hono/secure-headers'
import { csrf } from 'hono/csrf'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'
import { createMiddleware } from 'hono/factory'

export const securityHeaders = secureHeaders()

export const csrfProtection = csrf()

export const requestSizeLimit = bodyLimit({
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

// ログイン試行: 15分間に10回まで
export const authRateLimiter = makeRateLimiter(15 * 60 * 1000, 10)
