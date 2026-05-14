import { Hono } from 'hono'
import { AdminAuth } from '@pages/admin/auth.tsx'
import { getdb } from '@modules/postgres.ts'
import { verifyPassword, DUMMY_HASH, DUMMY_SALT } from '@modules/crypto.ts'
import { validate, req, maxLen } from '@modules/validator.ts'
import { safeParseBody } from '@modules/parser.ts'
import type { SiteData } from '@modules/types.ts'

const adminAuthCtl = new Hono().basePath('/admin')

const siteData: SiteData = { title: '管理者ログイン' }

adminAuthCtl.get('/auth', (c) => c.html(<AdminAuth siteData={siteData} />))

adminAuthCtl.post('/auth', async (c) => {
    const form   = await safeParseBody(c)
    const errors = validate(form, {
        login_id: [req('ログインID'), maxLen('ログインID', 255)],
        password: [req('パスワード'), maxLen('パスワード', 255)],
    })
    if (Object.keys(errors).length > 0) {
        return c.html(<AdminAuth siteData={siteData} errors={errors} />)
    }

    const login_id = form.login_id as string
    const db       = await getdb()
    const result   = await db.execute(
        'SELECT id, login_id, password, salt FROM admin WHERE login_id = $1 LIMIT 1',
        [login_id])
    db.release()

    const storedHash = result.length > 0 ? result[0].password : DUMMY_HASH
    const storedSalt = result.length > 0 ? result[0].salt     : DUMMY_SALT
    const match      = await verifyPassword(form.password as string, storedHash, storedSalt)

    if (result.length > 0 && match) {
        c.set('session_key_rotation', true)
        const session = c.get('session')
        session.set('admin_login', result[0].id)
        return c.redirect('/admin', 302)
    }
    return c.html(<AdminAuth siteData={siteData}
        errors={{ login_id: 'ログインIDまたはパスワードが正しくありません' }} />)
})

adminAuthCtl.post('/logout', (c) => {
    const session = c.get('session')
    session.deleteSession()
    return c.redirect('/admin/auth', 302)
})

export { adminAuthCtl }
