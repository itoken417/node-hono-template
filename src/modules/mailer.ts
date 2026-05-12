import nodemailer from 'nodemailer';

const isConfigured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
);

const transporter = isConfigured
    ? nodemailer.createTransport({
        host:   process.env.SMTP_HOST,
        port:   Number(process.env.SMTP_PORT ?? 587),
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

    if (!isConfigured || !transporter) {
        console.log(`[sendMail] to=${to} subject=${subject}\n${body}`);
        return;
    }
    await transporter.sendMail({ from, to, subject, text: body });
}

export async function sendErrorMail(subject: string, body: string): Promise<void> {
    if (!isConfigured || !transporter) return;

    const to = process.env.ERROR_TO;
    const from = process.env.SYSTEM_MAIL;
    if (!to || !from) return;

    await transporter.sendMail({ from, to, subject, text: body });
}
