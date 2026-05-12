import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { MailForm } from '@pages/sample/mail.tsx'
import { sendMail } from '@modules/mailer.ts'
import { validate, req, email } from '@modules/validator.ts'

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
    return c.html(<MailForm />)
})

mailCtl.post('/',
    validator('form', (form) => {
        const error = validate(form, {
            name:    [req('お名前')],
            email:   [req('メールアドレス'), email('メールアドレス')],
            subject: [req('件名')],
            message: [req('本文')],
        })
        if (Object.keys(error).length > 0) return { error }
        return {
            name:    form.name    as string,
            email:   form.email   as string,
            type:    form.type    as string | undefined,
            subject: form.subject as string,
            message: form.message as string,
            contact: form.contact as string | undefined,
            agree:   form.agree   as string | undefined,
        }
    }),
    async (c) => {
        const form = c.req.valid('form')

        if ('error' in form) {
            return c.html(<MailForm error={form.error} />)
        }

        const to = process.env.SYSTEM_MAIL
        if (!to) return c.html(<MailForm sent={true} />)

        const typeLabel    = TYPE_LABELS[form.type ?? ''] ?? '未選択'
        const contactLabel = CONTACT_LABELS[form.contact ?? ''] ?? '未選択'
        const agreeLabel   = form.agree === '1' ? '同意済み' : '未同意'

        const subject = `[お問い合わせ] ${form.subject}`
        const body = [
            `お名前         : ${form.name}`,
            `メール         : ${form.email}`,
            `種別           : ${typeLabel}`,
            `希望連絡方法   : ${contactLabel}`,
            `個人情報同意   : ${agreeLabel}`,
            ``,
            form.message,
        ].join('\n')

        await sendMail(to, subject, body, form.email)

        return c.html(<MailForm sent={true} />)
    }
)

export { mailCtl }
