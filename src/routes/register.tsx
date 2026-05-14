import { Hono } from 'hono'
import { Register } from '@pages/register.tsx'
import { getdb } from '@modules/postgres.ts'
import { hashPassword } from '@modules/crypto.ts'
import { validate, req, maxLen, password } from '@modules/validator.ts'
import { safeParseBody } from '@modules/parser.ts'
import type { SiteData } from '@modules/types.ts'

const registerCtl = new Hono().basePath('/auth/register')

const siteData: SiteData = { title: '新規登録', description: '新規登録ページ' }

registerCtl.get('/', (c) => c.html(<Register siteData={siteData} />))

registerCtl.post('/', async (c) => {
    const form = await safeParseBody(c)

    const errors = validate(form, {
        login_id:        [req('ログインID'), maxLen('ログインID', 255)],
        password:        [req('パスワード'), password('パスワード')],
        password_confirm: [req('パスワード（確認）')],
    })

    if (!errors.password_confirm && form.password !== form.password_confirm) {
        errors.password_confirm = 'パスワードが一致しません'
    }

    const values = { login_id: form.login_id as string }

    if (Object.keys(errors).length > 0) {
        return c.html(<Register siteData={siteData} errors={errors} values={values} />)
    }

    const login_id = form.login_id as string

    const db = await getdb()
    const existing = await db.execute(
        'SELECT id FROM member WHERE login_id = $1',
        [login_id]
    )
    if (existing.length > 0) {
        return c.html(<Register siteData={siteData}
            errors={{ login_id: 'このログインIDは既に使用されています' }}
            values={values} />)
    }

    const { salt, hash } = await hashPassword(form.password as string)
    await db.execute(
        'INSERT INTO member (login_id, password, salt) VALUES ($1, $2, $3)',
        [login_id, hash, salt]
    )
    await db.release()

    return c.redirect('/auth', 302)
})

export { registerCtl }
