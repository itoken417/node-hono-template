import { Hono } from 'hono'
import { Register } from '@pages/register.tsx'
import { Verify } from '@pages/verify.tsx'
import { getdb } from '@modules/postgres.ts'
import { hashPassword, hashEmail, generateVerifyCode } from '@modules/crypto.ts'
import { encryptValue } from '@modules/env_crypto.ts'
import { sendMail } from '@modules/mailer.ts'
import { validate, req, maxLen, email, password } from '@modules/validator.ts'
import { safeParseBody } from '@modules/parser.ts'
import { issueFormToken, consumeFormToken, isHoneypot } from '@modules/formToken.ts'
import type { SiteData } from '@modules/types.ts'

const registerCtl = new Hono().basePath('/auth/register')

const siteData: SiteData = { title: '新規登録' }
const verifySiteData: SiteData = { title: 'メールアドレス確認' }

registerCtl.get('/', (c) => c.html(<Register siteData={siteData} token={issueFormToken(c)} />))

registerCtl.post('/', async (c) => {
    const form = await safeParseBody(c)
    if (isHoneypot(form)) return c.redirect('/auth/register', 302)
    if (!consumeFormToken(c, form._token)) return c.redirect('/auth/register', 302)

    const errors = validate(form, {
        login_id:         [req('ログインID'), maxLen('ログインID', 255)],
        email:            [req('メールアドレス'), email('メールアドレス')],
        password:         [req('パスワード'), password('パスワード')],
        password_confirm: [req('パスワード（確認）')],
    })
    if (!errors.password_confirm && form.password !== form.password_confirm) {
        errors.password_confirm = 'パスワードが一致しません'
    }

    const values = { login_id: form.login_id as string, email: form.email as string }
    if (Object.keys(errors).length > 0) {
        return c.html(<Register siteData={siteData} errors={errors} values={values} />)
    }

    const login_id  = form.login_id as string
    const emailAddr = (form.email as string).toLowerCase()
    const emailHash = hashEmail(emailAddr)

    const db = await getdb()

    // 期限切れ pending を掃除
    await db.execute('DELETE FROM member_pending WHERE expires_at < NOW()')

    const existingId = await db.execute(
        'SELECT id FROM member WHERE login_id = $1', [login_id])
    if (existingId.length > 0) {
        await db.release()
        return c.html(<Register siteData={siteData}
            errors={{ login_id: 'このログインIDは既に使用されています' }} values={values} />)
    }
    const existingEmail = await db.execute(
        'SELECT id FROM member WHERE email_hash = $1', [emailHash])
    if (existingEmail.length > 0) {
        await db.release()
        return c.html(<Register siteData={siteData}
            errors={{ email: 'このメールアドレスは既に登録されています' }} values={values} />)
    }

    const { salt, hash } = await hashPassword(form.password as string)
    const encEmail = encryptValue(emailAddr)
    const code     = generateVerifyCode()
    const expires  = new Date(Date.now() + 30 * 60 * 1000)

    await db.execute(
        'DELETE FROM member_pending WHERE login_id = $1 OR email_hash = $2',
        [login_id, emailHash])
    await db.execute(
        `INSERT INTO member_pending (login_id, email, email_hash, password, salt, code, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [login_id, encEmail, emailHash, hash, salt, code, expires.toISOString()])
    await db.release()

    const subject = '【メールアドレス確認】確認コードのお知らせ'
    const body    = `確認コード: ${code}\n\nこのコードの有効期限は30分です。`
    await sendMail(emailAddr, subject, body)

    const session = c.get('session')
    session.set('pending_register', login_id)
    return c.redirect('/auth/register/verify', 302)
})

registerCtl.get('/verify', (c) => {
    const session = c.get('session')
    if (!session.get('pending_register')) return c.redirect('/auth/register', 302)
    return c.html(<Verify siteData={verifySiteData} token={issueFormToken(c)} />)
})

registerCtl.post('/verify', async (c) => {
    const form   = await safeParseBody(c)
    if (isHoneypot(form)) return c.redirect('/auth/register/verify', 302)
    if (!consumeFormToken(c, form._token)) return c.redirect('/auth/register/verify', 302)

    const session  = c.get('session')
    const login_id = session.get('pending_register')
    if (!login_id) return c.redirect('/auth/register', 302)
    const errors = validate(form, { code: [req('確認コード')] })
    if (Object.keys(errors).length > 0) {
        return c.html(<Verify siteData={verifySiteData} errors={errors} />)
    }

    const db      = await getdb()
    const pending = await db.execute(
        `SELECT * FROM member_pending WHERE login_id = $1 AND expires_at > NOW() LIMIT 1`,
        [login_id])

    if (pending.length === 0) {
        await db.release()
        session.set('pending_register', undefined)
        return c.redirect('/auth/register', 302)
    }

    if (pending[0].code !== (form.code as string).trim()) {
        await db.release()
        return c.html(<Verify siteData={verifySiteData}
            errors={{ code: '確認コードが正しくありません' }} />)
    }

    const p = pending[0]
    await db.execute(
        `INSERT INTO member (login_id, email, email_hash, password, salt)
         VALUES ($1, $2, $3, $4, $5)`,
        [p.login_id, p.email, p.email_hash, p.password, p.salt])
    await db.execute('DELETE FROM member_pending WHERE login_id = $1', [login_id])
    await db.release()

    session.set('pending_register', undefined)
    return c.redirect('/auth', 302)
})

export { registerCtl }
