import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { MailForm } from '@pages/sample/mail.tsx'
import { sendMail } from '@modules/mailer.ts'
import { validate, req, email } from '@modules/validator.ts'

const mailCtl = new Hono().basePath('/sample/mail')

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
            subject: form.subject as string,
            message: form.message as string,
        }
    }),
    async (c) => {
        const form = c.req.valid('form')

        if ('error' in form) {
            return c.html(<MailForm error={form.error} />)
        }

        const to = process.env.SYSTEM_MAIL
        if (!to) return c.html(<MailForm sent={true} />)
        const subject = `[お問い合わせ] ${form.subject}`
        const body = `お名前: ${form.name}\nメール: ${form.email}\n\n${form.message}`
        await sendMail(to, subject, body, form.email)

        return c.html(<MailForm sent={true} />)
    }
)

export { mailCtl }
