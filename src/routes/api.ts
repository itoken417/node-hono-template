import { Hono } from 'hono';
import { issueApiKey } from '@modules/apiKey.ts';

const apiCtl = new Hono().basePath('/api');

apiCtl.post('/key', async (c) => {
    const issuerKey = c.req.header('X-Issuer-Key');
    if (!issuerKey || issuerKey !== process.env.API_ISSUER_KEY) {
        return c.json({ error: 'Forbidden' }, 403);
    }
    const body = await c.req.json<{ label?: string }>().catch(() => ({}));
    const label = body.label ?? 'unnamed';
    const key = issueApiKey(label);
    return c.json({ key, label }, 201);
});

export { apiCtl as api };
