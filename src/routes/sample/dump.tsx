import { Hono } from 'hono'
import { DumpPage } from '@pages/sample/dump.tsx'

const dumpCtl = new Hono().basePath('/sample/dump')

const sampleData = {
    user: { id: 1, name: 'テスト太郎', roles: ['admin', 'user'] },
    meta: { createdAt: new Date(), active: true, count: 42 },
    nested: { a: { b: { c: 'deep value' } } },
    arr: [1, 'two', null, undefined, { obj: true }],
}

dumpCtl.get('/', (c) => c.html(<DumpPage data={sampleData} />))

export { dumpCtl as sampleDump }
