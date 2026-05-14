import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

interface Entry {
    count: number
    resetAt: number
}

function makeStore(windowMs: number, max: number) {
    const store = new Map<string, Entry>()

    // 古いエントリを定期的に削除してメモリリークを防ぐ
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
            if (entry.count > max) {
                throw new HTTPException(429)
            }
        }
        await next()
    })
}

// ログイン試行: 15分間に10回まで
export const authRateLimiter = makeStore(15 * 60 * 1000, 10)
