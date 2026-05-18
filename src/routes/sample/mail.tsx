import { Hono } from 'hono'
import { MailForm } from '@pages/sample/mail.tsx'
import { sendMail } from '@modules/mailer.ts'
import { validate, req, email } from '@modules/validator.ts'
import { safeParseBody } from '@modules/parser.ts'
import { generateFormToken } from '@modules/crypto.ts'

const mailCtl = new Hono().basePath('/sample/mail')

const TYPE_LABELS: Record<string, string> = {
    product: '製品について',
    service: 'サービスについて',
    other:   'その他',
}

const CONTACT_LABELS: Record<string, string> = {
    email: 'メール',
    phone: '電話',
}

mailCtl.get('/', (c) => {
    const token = generateFormToken()
    const session = c.get('session')
    session.set('mail_token', token)
    return c.html(<MailForm token={token} />)
})

mailCtl.post('/', async (c) => {
    const session = c.get('session')
    const sessionToken = session.get('mail_token')
    session.set('mail_token', undefined)

    const form = await safeParseBody(c)
    // ハニーポット: ボットが入力した場合は送信済みに見せて無視する
    if (form.website) return c.html(<MailForm sent={true} />)
    // フォームトークン検証: GETを踏まずに直接POSTされた場合はフォームへ戻す
    if (!sessionToken || form._token !== sessionToken) return c.redirect('/sample/mail', 302)

    const errors = validate(form, {
        name:    [req('お名前')],
        email:   [req('メールアドレス'), email('メールアドレス')],
        subject: [req('件名')],
        message: [req('本文')],
    })
    if (Object.keys(errors).length > 0) {
        return c.html(<MailForm error={errors} />)
    }

    const to = process.env.SYSTEM_MAIL
    if (!to) return c.html(<MailForm sent={true} />)

    const typeLabel    = TYPE_LABELS[form.type    as string ?? ''] ?? '未選択'
    const contactLabel = CONTACT_LABELS[form.contact as string ?? ''] ?? '未選択'
    const agreeLabel   = form.agree === '1' ? '同意済み' : '未同意'

    const subject = `[お問い合わせ] ${form.subject as string}`
    const body = [
        `お名前         : ${form.name as string}`,
        `メール         : ${form.email as string}`,
        `種別           : ${typeLabel}`,
        `希望連絡方法   : ${contactLabel}`,
        `個人情報同意   : ${agreeLabel}`,
        ``,
        form.message as string,
    ].join('\n')

    await sendMail(to, subject, body, form.email as string)

    return c.html(<MailForm sent={true} />)
})

export { mailCtl }
