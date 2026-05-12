import nodemailer from 'nodemailer';

const isRelease = process.env.NODE_ENV === 'production';

const transporter = isRelease
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    })
    : null;

export async function sendMail(to: string, subject: string, body: string): Promise<void> {
    const from = process.env.SYSTEM_MAIL;
    if (!from) return;

    if (!isRelease || !transporter) {
        console.log(`[sendMail] to=${to} subject=${subject}\n${body}`);
        return;
    }
    await transporter.sendMail({ from, to, subject, text: body });
}

export async function sendErrorMail(subject: string, body: string): Promise<void> {
    if (!isRelease || !transporter) return;

    const to = process.env.ERROR_TO;
    const from = process.env.SYSTEM_MAIL;
    if (!to || !from) return;

    await transporter.sendMail({ from, to, subject, text: body });
}
