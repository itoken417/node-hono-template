import { Hono } from 'hono'
import { MailForm } from '@pages/sample/mail.tsx'
import { sendMail } from '@modules/mailer.ts'
import { validate, req, email } from '@modules/validator.ts'
import { safeParseBody } from '@modules/parser.ts'
import { issueFormToken, consumeFormToken, isHoneypot } from '@modules/formToken.ts'

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
    return c.html(<MailForm token={issueFormToken(c)} />)
})

mailCtl.post('/', async (c) => {
    const form = await safeParseBody(c)
    if (isHoneypot(form)) return c.html(<MailForm sent={true} />)
    if (!consumeFormToken(c, form._token)) return c.redirect('/sample/mail', 302)

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

export { mailCtl as sampleMail }
