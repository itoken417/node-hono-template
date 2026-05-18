import { Hono } from 'hono'
import { Auth } from '@pages/auth.tsx'
import { pool, cursor } from '@modules/postgres.ts'
import { verifyPassword, DUMMY_HASH, DUMMY_SALT } from '@modules/crypto.ts'
import { validate, req, maxLen } from '@modules/validator.ts'
import { safeParseBody } from '@modules/parser.ts'
import { issueFormToken, consumeFormToken, isHoneypot } from '@modules/formToken.ts'
import type { SiteData } from '@modules/types.ts'

const authCtl = new Hono().basePath('/auth')

const siteData: SiteData = { title: 'auth page', description: 'test page' }

authCtl.get('/', (c) => c.html(<Auth siteData={siteData} token={issueFormToken(c)} />))

authCtl.post('/', async (c) => {
    const form = await safeParseBody(c)
    if (isHoneypot(form)) return c.redirect('/auth', 302)
    if (!consumeFormToken(c, form._token)) return c.redirect('/auth', 302)

    const errors = validate(form, {
        login_id: [req('ログインID'), maxLen('ログインID', 255)],
        password: [req('パスワード'), maxLen('パスワード', 255)],
    })
    if (Object.keys(errors).length > 0) {
        return c.html(<Auth siteData={siteData} errors={errors} />)
    }

    const login_id = form.login_id as string
    const password = form.password as string
    const sql = `SELECT id, login_id, password, salt FROM member
        WHERE login_id = $1
        ORDER BY id LIMIT 1;`
    const csr = cursor(sql, [login_id])
    const client = await pool.connect()
    const itr = client.query(csr)
    const member = await itr.read(1)
    csr.close()
    client.release()
    const storedHash = member.length > 0 ? member[0].password : DUMMY_HASH
    const storedSalt = member.length > 0 ? member[0].salt : DUMMY_SALT
    const passwordMatch = await verifyPassword(password, storedHash, storedSalt)
    if (member.length > 0 && passwordMatch) {
        c.set('session_key_rotation', true)
        const session = c.get('session')
        session.set('login', member[0].id)
        return c.redirect('/member', 302)
    }
    return c.html(<Auth siteData={siteData} errors={{ login_id: 'ログインIDまたはパスワードが正しくありません' }} />)
})

export { authCtl }
