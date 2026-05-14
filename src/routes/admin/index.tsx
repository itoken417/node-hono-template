import { Hono } from 'hono'
import { AdminIndex } from '@pages/admin/index.tsx'
import { getdb } from '@modules/postgres.ts'
import { decryptValue, ENC_PREFIX } from '@modules/env_crypto.ts'

const adminCtl = new Hono().basePath('/admin')

adminCtl.get('/', async (c) => {
    const db      = await getdb()
    const rows    = await db.execute(
        'SELECT id, login_id, email, create_time FROM member ORDER BY id')
    db.release()

    const members = rows.map((row: any) => ({
        ...row,
        email: row.email?.startsWith(ENC_PREFIX)
            ? decryptValue(row.email)
            : row.email ?? null,
    }))

    return c.html(<AdminIndex members={members} />)
})

export { adminCtl }
