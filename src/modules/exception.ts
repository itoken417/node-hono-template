import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { errorLogger } from '@modules/logger.ts'
import { sendErrorMail } from '@modules/mailer.ts'
import { ErrorPage } from '@pages/error.tsx'

const HTTP_MESSAGES: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    413: 'Request Entity Too Large',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
}

const PARSE_ERROR_PATTERNS = [
    'boundary',
    'multipart',
    'Could not parse',
    'invalid content-type',
    'content-type',
]

export const onError = (err: Error, c: Context) => {
    if (err instanceof HTTPException) {
        const status = err.status
        const message = HTTP_MESSAGES[status] ?? err.message
        return c.html(ErrorPage({ status, message }), status)
    }
    // リクエストボディの解析失敗は 400 として処理（ログ・メール通知不要）
    if (err instanceof TypeError) {
        const msg = err.message.toLowerCase()
        if (PARSE_ERROR_PATTERNS.some(p => msg.includes(p))) {
            return c.html(ErrorPage({ status: 400, message: 'Bad Request' }), 400)
        }
    }
    errorLogger.error({
        message: err.message,
        stack:   err.stack,
        method:  c.req.method,
        url:     c.req.path,
    });
    const subject = `[ERROR] ${c.req.method} ${c.req.path}`;
    const body = `message: ${err.message}\n\nstack:\n${err.stack}`;
    sendErrorMail(subject, body).catch(() => {});
    return c.html(ErrorPage({ status: 500, message: 'Internal Server Error' }), 500);
};

export const notFound = (c: Context) => {
    return c.html(ErrorPage({ status: 404, message: 'Not Found' }), 404);
};
