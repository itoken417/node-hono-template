import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { validateApiKey } from '@modules/apiKey.ts';

export const apiAuth = createMiddleware(async (c, next) => {
    const key = c.req.header('X-API-Key');
    if (!key || !validateApiKey(key)) {
        throw new HTTPException(401, { message: 'Invalid or missing API key' });
    }
    await next();
});
