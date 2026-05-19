import { Hono } from 'hono';
import { readFileSync } from 'fs';
import { join } from 'path';
import { apiAuth } from '@middleware/apiAuth.ts';

const apiSampleCtl = new Hono().basePath('/api/sample/item');

type Item = { id: number; name: string; price: number };
const seed: Item[] = JSON.parse(
    readFileSync(join(process.cwd(), 'data/sample/api.json'), 'utf-8')
);
let items: Item[] = [...seed];
let nextId = Math.max(...seed.map((i) => i.id)) + 1;

apiSampleCtl.use('/*', apiAuth);
apiSampleCtl.use('/', apiAuth);

apiSampleCtl.get('/', (c) => {
    return c.json({ items });
});

apiSampleCtl.get('/:id', (c) => {
    const id = Number(c.req.param('id'));
    const item = items.find((i) => i.id === id);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ item });
});

apiSampleCtl.post('/', async (c) => {
    const body = await c.req.json<{ name?: string; price?: number }>().catch(() => ({}));
    if (!body.name || body.price === undefined) {
        return c.json({ error: 'name と price は必須です' }, 400);
    }
    const item: Item = { id: nextId++, name: body.name, price: body.price };
    items.push(item);
    return c.json({ item }, 201);
});

apiSampleCtl.delete('/:id', (c) => {
    const id = Number(c.req.param('id'));
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return c.json({ error: 'Not found' }, 404);
    items.splice(index, 1);
    return c.json({ message: '削除しました' });
});

export { apiSampleCtl as apiSample };
