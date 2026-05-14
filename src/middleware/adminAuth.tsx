import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { getdb } from '@modules/postgres.ts'

export const adminAuthMiddleware = createMiddleware(async (c, next) => {
    const session = c.get('session')
    const id = session.get('admin_login')
    let admin
    if (id) {
        const db = await getdb()
        const result = await db.execute(
            'SELECT id, login_id, create_time FROM admin WHERE id = $1 LIMIT 1',
            [String(id)]
        )
        db.release()
        admin = result[0]
    }
    if (admin) {
        c.set('admin', admin)
    } else {
        const res = c.redirect('/admin/auth', 302)
        throw new HTTPException(302, { res })
    }
    await next()
})
