import { createMiddleware } from 'hono/factory';
import { accessLogger } from '@modules/logger.ts';

export const accessLogMiddleware = createMiddleware(async (c, next) => {
    const start = Date.now();
    await next();
    accessLogger.info({
        method: c.req.method,
        url:    c.req.path,
        status: c.res.status,
        ms:     Date.now() - start,
        ip:     c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? '',
        ua:     c.req.header('user-agent') ?? '',
    });
});
